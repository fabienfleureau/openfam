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

  cmd.command('scan')
    .description('Scan for devices')
    .option('--show-ipv6', 'Show IPv6 addresses (hidden by default)')
    .action(scanDevices);
  cmd.command('list').description('List all devices').action(listDevices);
  cmd.command('add <profileId> <mac>')
    .option('--name <name>', 'Device name')
    .action(addDevice);
  cmd.command('remove <mac>').description('Remove device').action(removeDevice);

  return cmd;
}

async function scanDevices(options: { showIpv6?: boolean }): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const devices = await router.scanDevices();

    if (devices.length === 0) {
      console.log(chalk.yellow('No devices found'));
      return;
    }

    // Build MAC to profile mapping
    const macToProfile = new Map<string, string>();
    const remoteConfig = await router.downloadConfig();
    if (remoteConfig) {
      for (const profile of remoteConfig.profiles) {
        for (const mac of profile.macs) {
          macToProfile.set(mac.address.toUpperCase(), profile.name);
        }
      }
    }

    // Filter out IPv6 addresses unless --show-ipv6 flag is set
    const filteredDevices = options.showIpv6
      ? devices
      : devices.filter(d => !d.ip || !d.ip.includes(':'));

    if (filteredDevices.length === 0) {
      console.log(chalk.yellow('No devices found (IPv6 hidden, use --show-ipv6 to see all)'));
      return;
    }

    console.log(chalk.cyan('\nConnected Devices:\n'));

    // Table header
    console.log(
      chalk.white('MAC Address'.padEnd(18)) +
      chalk.white('IP Address'.padEnd(40)) +
      chalk.white('Hostname'.padEnd(20)) +
      chalk.white('Profile')
    );
    console.log(chalk.gray('─'.repeat(95)));

    // Table rows (sort by IP)
    filteredDevices
      .sort((a, b) => {
        // Handle missing IPs
        if (!a.ip) return 1;
        if (!b.ip) return -1;
        return a.ip.localeCompare(b.ip, undefined, { numeric: true });
      })
      .forEach(d => {
        const profile = macToProfile.get(d.mac!);
        console.log(
          chalk.cyan((d.mac || '').padEnd(18)) +
          chalk.white((d.ip || '').padEnd(40)) +
          chalk.gray((d.hostname || '—').padEnd(20)) +
          (profile ? chalk.green(profile) : chalk.dim('—'))
        );
      });
    console.log();
  } finally {
    ssh.disconnect();
  }
}

async function listDevices(): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();

    if (!remoteConfig || remoteConfig.profiles.length === 0) {
      console.log(chalk.yellow('No profiles/config found'));
      return;
    }

    console.log(chalk.cyan('\nAll Devices:\n'));

    // Table header
    console.log(
      chalk.white('MAC Address'.padEnd(18)) +
      chalk.white('Device Name'.padEnd(25)) +
      chalk.white('Profile')
    );
    console.log(chalk.gray('─'.repeat(55)));

    // Table rows
    remoteConfig.profiles.forEach(p => {
      if (p.macs.length > 0) {
        p.macs.forEach(m => {
          console.log(
            chalk.cyan(m.address.padEnd(18)) +
            chalk.white(m.name.padEnd(25)) +
            chalk.green(p.name)
          );
        });
      }
    });
    console.log();
  } finally {
    ssh.disconnect();
  }
}

async function addDevice(profileId: string, mac: string, options: { name?: string }): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const macUpper = mac.toUpperCase();
    if (!isValidMacAddress(macUpper)) {
      throw new Error(`Invalid MAC format: ${mac} (must be XX:XX:XX:XX:XX:XX)`);
    }

    const index = parseInt(profileId) - 1;
    if (index < 0 || index >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[index];

    for (const p of remoteConfig.profiles) {
      if (p.macs.some(m => m.address === macUpper)) {
        throw new Error(`MAC ${macUpper} already in "${p.name}"`);
      }
    }

    let deviceName = options.name;
    if (!deviceName) {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Device name:',
        default: `Device ${macUpper.slice(-6)}`
      }]);
      deviceName = answers.name || `Device ${macUpper.slice(-6)}`;
    }

    profile.macs.push({ address: macUpper, name: deviceName! });
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

    const macUpper = mac.toUpperCase();
    for (const profile of remoteConfig.profiles) {
      const idx = profile.macs.findIndex(m => m.address === macUpper);
      if (idx !== -1) {
        const removed = profile.macs.splice(idx, 1)[0];
        await router.uploadConfig(remoteConfig);
        console.log(chalk.green(`\n✓ Removed "${removed.name}" from "${profile.name}"\n`));
        return;
      }
    }
    throw new Error(`MAC ${macUpper} not found`);
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}
