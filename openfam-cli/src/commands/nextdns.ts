import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createNextDNSCommand(): Command {
  const cmd = new Command('nextdns').description('Manage NextDNS profiles');

  cmd.command('list').description('List profiles').action(listProfiles);
  cmd.command('add <id> <name>').description('Add profile').action(addProfile);
  cmd.command('remove <id>').description('Remove profile').action(removeProfile);

  return cmd;
}

async function listProfiles(): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();

    if (!remoteConfig || Object.keys(remoteConfig.nextdns.profiles).length === 0) {
      console.log(chalk.yellow('No NextDNS profiles configured'));
      return;
    }

    console.log(chalk.cyan('\nNextDNS Profiles:\n'));
    for (const [key, profile] of Object.entries(remoteConfig.nextdns.profiles)) {
      console.log(chalk.white(`${key}:`));
      console.log(chalk.gray(`  Name: ${profile.name}`));
      console.log(chalk.gray(`  ID: ${profile.id}`));
      console.log(chalk.blue(`  Link: ${profile.link}\n`));
    }
  } finally {
    ssh.disconnect();
  }
}

async function addProfile(id: string, name: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const key = id;
    if (remoteConfig.nextdns.profiles[key]) {
      throw new Error(`Profile "${key}" already exists`);
    }

    remoteConfig.nextdns.profiles[key] = {
      id,
      name,
      link: `https://my.nextdns.io/profile/${id}`
    };

    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Added "${name}" as "${key}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function removeProfile(id: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    for (const profile of remoteConfig.profiles) {
      if (profile.default_nextdns === id) {
        throw new Error(`Cannot remove: used by "${profile.name}"`);
      }
      for (const schedule of profile.schedule) {
        if (schedule.nextdns === id) {
          throw new Error(`Cannot remove: used in schedule of "${profile.name}"`);
        }
      }
    }

    if (!remoteConfig.nextdns.profiles[id]) {
      throw new Error(`Profile "${id}" not found`);
    }

    delete remoteConfig.nextdns.profiles[id];
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Removed "${id}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}
