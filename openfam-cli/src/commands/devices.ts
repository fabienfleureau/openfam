import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';
import { isValidMacAddress } from '../types/config.js';

export function createDevicesCommand(): Command {
  const cmd = new Command('devices').description('Manage devices');

  // Default action - show both connected and configured devices
  cmd.action(async (options) => {
    await showDevices(options);
  });

  // Keep scan as alias with option
  cmd.command('scan')
    .description('Scan for devices')
    .option('--show-ipv6', 'Show IPv6 addresses (hidden by default)')
    .action(showDevices);

  cmd.command('list')
    .alias('ls')
    .description('List all devices (alias for devices)')
    .action(showDevices);

  cmd.command('add <profile> <mac>')
    .option('--name <name>', 'Device name')
    .action(addDevice);

  cmd.command('remove <mac>')
    .description('Remove device')
    .action(removeDevice);

  return cmd;
}

async function showDevices(options: { showIpv6?: boolean } = {}): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();

    // 1. Get current time from router for "Last Seen" calculation
    const timeResult = await ssh.exec('date +%s');
    const currentTime = parseInt(timeResult.stdout.trim(), 10) || Math.floor(Date.now() / 1000);

    // 2. Fetch live data and configuration
    const [discoveredDevices, remoteConfig] = await Promise.all([
      router.scanDevices(),
      router.downloadConfig()
    ]);

    // 3. Unified map of all devices
    const allDevices = new Map<string, {
      mac: string;
      ip?: string;
      hostname?: string;
      expiry?: number;
      configName?: string;
      profileName?: string;
    }>();

    // Add discovered devices
    discoveredDevices.forEach(d => {
      allDevices.set(d.mac, { ...d });
    });

    // Add configured devices (and override/merge)
    if (remoteConfig) {
      remoteConfig.profiles.forEach(p => {
        p.macs.forEach(m => {
          const upperMac = m.address.toUpperCase();
          const existing = allDevices.get(upperMac) || { mac: upperMac };
          allDevices.set(upperMac, {
            ...existing,
            configName: m.name,
            profileName: p.name
          });
        });
      });
    }

    const deviceList = Array.from(allDevices.values());

    if (deviceList.length === 0) {
      console.log(chalk.yellow('\nNo devices found or configured.\n'));
      return;
    }

    // Filter IPv6
    const filteredList = options.showIpv6
      ? deviceList
      : deviceList.filter(d => !d.ip || !d.ip.includes(':'));

    console.log(chalk.cyan('\nDevice Inventory (Grouped by Profile):\n'));

    // Table header
    const printHeader = () => {
      console.log(
        chalk.bold.white('MAC ADDRESS'.padEnd(20)) +
        chalk.bold.white('NAME/HOSTNAME'.padEnd(30)) +
        chalk.bold.white('IP ADDRESS'.padEnd(18)) +
        chalk.bold.white('STATUS')
      );
      console.log(chalk.gray('─'.repeat(82)));
    };

    // Helper for status
    const formatStatus = (expiry: number | undefined) => {
      if (!expiry) return chalk.dim('never seen');
      if (expiry > currentTime) return chalk.bold.green('Online');
      
      const diff = currentTime - expiry;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return chalk.yellow(`${mins}m ago`);
      const hours = Math.floor(mins / 60);
      if (hours < 24) return chalk.gray(`${hours}h ago`);
      const days = Math.floor(hours / 24);
      return chalk.dim(`${days}d ago`);
    };

    // Grouping logic
    const grouped: Record<string, typeof filteredList> = {};
    const profileNames = (remoteConfig?.profiles || []).map(p => p.name);
    
    // Initialize groups
    profileNames.forEach(name => { grouped[name] = []; });
    grouped['Unassigned'] = [];

    // Fill groups
    filteredList.forEach(d => {
      const group = d.profileName || 'Unassigned';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(d);
    });

    // Display each group
    [...profileNames, 'Unassigned'].forEach(group => {
      const groupDevices = grouped[group];
      if (groupDevices.length === 0 && group !== 'Unassigned') {
        // Skip empty configured profiles if they have no devices
        return;
      }
      if (groupDevices.length === 0 && group === 'Unassigned') {
        return;
      }

      console.log(chalk.bold.blue(`\n[ ${group.toUpperCase()} ]`));
      printHeader();

      groupDevices
        .sort((a, b) => {
          const aOnline = (a.expiry || 0) > currentTime;
          const bOnline = (b.expiry || 0) > currentTime;
          if (aOnline !== bOnline) return aOnline ? -1 : 1;
          return (a.configName || a.hostname || '').localeCompare(b.configName || b.hostname || '');
        })
        .forEach(d => {
          const isUnknown = !d.configName && !d.hostname;
          const displayName = d.configName || d.hostname || 'unknown';
          const nameColor = isUnknown ? chalk.dim : (d.configName ? chalk.white : chalk.gray);
          
          console.log(
            chalk.cyan(d.mac.padEnd(20)) +
            nameColor(displayName.slice(0, 29).padEnd(30)) +
            chalk.gray((d.ip || '—').padEnd(18)) +
            formatStatus(d.expiry)
          );
        });
    });

    console.log();
    
    if (!remoteConfig || remoteConfig.profiles.length === 0) {
      console.log(chalk.gray('Tip: Run "openfam profiles add" to create your first profile.'));
    } else if (deviceList.some(d => !d.profileName)) {
      console.log(chalk.gray('Tip: Run "openfam devices add <profile> <mac>" to assign unassigned devices.'));
    }
    console.log();

  } finally {
    ssh.disconnect();
  }
}

async function addDevice(profileIdentifier: string, mac: string, options: { name?: string }): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    // Normalize MAC address - accept various formats
    // aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabbccddeeff -> AA:BB:CC:DD:EE:FF
    let normalizedMac = mac.toUpperCase();

    // Remove any existing separators first
    normalizedMac = normalizedMac.replace(/[:\-]/g, '');

    // Add colons every 2 characters
    if (normalizedMac.length === 12) {
      normalizedMac = normalizedMac.match(/.{2}/g)?.join(':') || normalizedMac;
    }

    // Validate format
    if (!isValidMacAddress(normalizedMac)) {
      throw new Error(`Invalid MAC format: ${mac} (must be XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, or XXXXXXXXXXXX)`);
    }

    if (!remoteConfig.profiles || remoteConfig.profiles.length === 0) {
      throw new Error('No profiles found. Run: openfam profiles add <name> first');
    }

    // Find profile by name or ID
    let profile = remoteConfig.profiles.find(p => p.name.toLowerCase() === profileIdentifier.toLowerCase());

    // If not found by name, try as a numeric ID
    if (!profile) {
      const index = parseInt(profileIdentifier) - 1;
      if (index >= 0 && index < remoteConfig.profiles.length) {
        profile = remoteConfig.profiles[index];
      }
    }

    if (!profile) {
      const availableNames = remoteConfig.profiles.map(p => p.name).join(', ');
      throw new Error(`Profile "${profileIdentifier}" not found. Available: ${availableNames} (or use 1-${remoteConfig.profiles.length})`);
    }

    for (const p of remoteConfig.profiles) {
      if (p.macs.some(m => m.address === normalizedMac)) {
        throw new Error(`MAC ${normalizedMac} already in "${p.name}"`);
      }
    }

    let deviceName = options.name;
    if (!deviceName) {
      // Try to find hostname from router
      let suggestedName = `Device ${normalizedMac.slice(-6)}`;
      try {
        const discoveredDevices = await router.scanDevices();
        const found = discoveredDevices.find(d => d.mac === normalizedMac);
        if (found && found.hostname) {
          suggestedName = found.hostname;
        }
      } catch (e) {
        // Ignore scan errors, use default
      }

      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Device name:',
        default: suggestedName
      }]);
      deviceName = answers.name || suggestedName;
    }

    profile.macs.push({ address: normalizedMac, name: deviceName! });
    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Added "${deviceName}" to "${profile.name}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function removeDevice(mac: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    // Normalize MAC address same way as addDevice
    let normalizedMac = mac.toUpperCase();
    normalizedMac = normalizedMac.replace(/[:\-]/g, '');
    if (normalizedMac.length === 12) {
      normalizedMac = normalizedMac.match(/.{2}/g)?.join(':') || normalizedMac;
    }

    for (const profile of remoteConfig.profiles) {
      const idx = profile.macs.findIndex(m => m.address === normalizedMac);
      if (idx !== -1) {
        const removed = profile.macs.splice(idx, 1)[0];
        await router.uploadConfig(remoteConfig);
        console.log(chalk.green(`\n✓ Removed "${removed.name}" from "${profile.name}"\n`));
        return;
      }
    }
    throw new Error(`MAC ${normalizedMac} not found`);
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}
