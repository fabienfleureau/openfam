import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';
import type { Profile } from '../types/config.js';

export function createProfilesCommand(): Command {
  const cmd = new Command('profiles').description('Manage user profiles');

  cmd.command('list').description('List profiles').action(listProfiles);
  cmd.command('add <name>').description('Create profile').action(addProfile);
  cmd.command('remove <id>').description('Delete profile').action(removeProfile);
  cmd.command('show <id>').description('Show profile details').action(showProfile);

  return cmd;
}

async function listProfiles(): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();

    if (!remoteConfig || remoteConfig.profiles.length === 0) {
      console.log(chalk.yellow('No profiles. Run: openfam profiles add <name>'));
      return;
    }

    console.log(chalk.cyan('\nUser Profiles:\n'));
    remoteConfig.profiles.forEach((p, i) => {
      console.log(chalk.white(`${i + 1}. ${p.name}`));
      console.log(chalk.gray(`   Default: ${p.default_nextdns}, MACs: ${p.macs.length}, Schedules: ${p.schedule.length}\n`));
    });
  } finally {
    ssh.disconnect();
  }
}

async function addProfile(name: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const available = Object.keys(remoteConfig.nextdns.profiles);
    const choices = available.map(key => ({
      name: `${key} - ${remoteConfig.nextdns.profiles[key].name}`,
      value: key
    }));
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'defaultNextdns',
      message: 'Default NextDNS profile:',
      choices
    }]);

    const newProfile: Profile = {
      name,
      default_nextdns: answers.defaultNextdns,
      macs: [],
      schedule: []
    };

    remoteConfig.profiles.push(newProfile);
    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Profile "${name}" created\n`));
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

    const index = parseInt(id) - 1;
    if (index < 0 || index >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const removed = remoteConfig.profiles.splice(index, 1)[0];
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Removed "${removed.name}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function showProfile(id: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const index = parseInt(id) - 1;
    if (index < 0 || index >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[index];
    console.log(chalk.cyan(`\n${profile.name}\n`));
    console.log(chalk.white(`Default NextDNS: ${profile.default_nextdns}\n`));
    console.log(chalk.white('Devices:'));
    profile.macs.forEach(m => console.log(chalk.gray(`  - ${m.address} (${m.name})`)));
    console.log(chalk.white('\nSchedule:'));
    profile.schedule.forEach((s, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${s.days.join(', ')} ${s.time_start}-${s.time_end} → ${s.nextdns}`));
    });
    console.log();
  } finally {
    ssh.disconnect();
  }
}
