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

  cmd.command('scan').description('Scan for devices').action(scanDevices);
  cmd.command('list').description('List all devices').action(listDevices);
  cmd.command('add <profileId> <mac>')
    .option('--name <name>', 'Device name')
    .action(addDevice);
  cmd.command('remove <mac>').description('Remove device').action(removeDevice);

  return cmd;
}

async function scanDevices(): Promise<void> {
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

    console.log(chalk.cyan('\nConnected Devices:\n'));

    // Table header (IPv6 can be up to 39 chars)
    console.log(
      chalk.white('MAC Address'.padEnd(18)) +
      chalk.white('IP Address'.padEnd(40)) +
      chalk.white('Hostname')
    );
    console.log(chalk.gray('─'.repeat(75)));

    // Table rows
    devices.forEach(d => {
      console.log(
        chalk.cyan((d.mac || '').padEnd(18)) +
        chalk.white((d.ip || '').padEnd(40)) +
        chalk.gray(d.hostname || '—')
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
    remoteConfig.profiles.forEach(p => {
      if (p.macs.length > 0) {
        console.log(chalk.white(`${p.name}:`));
        p.macs.forEach(m => console.log(chalk.gray(`  - ${m.address} (${m.name})`)));
        console.log();
      }
    });
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
