import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createScheduleCommand(): Command {
  const cmd = new Command('schedule').description('Manage schedules');

  cmd.command('add <profile>').description('Add schedule').action(addSchedule);
  cmd.command('remove <profile> <index>').description('Remove schedule').action(removeSchedule);
  cmd.command('show <profile>').description('Show schedule').action(showSchedule);

  return cmd;
}

// Helper: Find profile by name or ID
function findProfile(profiles: any[], identifier: string) {
  // Try by name (case-insensitive)
  let profile = profiles.find(p => p.name.toLowerCase() === identifier.toLowerCase());

  // If not found, try as numeric ID
  if (!profile) {
    const index = parseInt(identifier) - 1;
    if (index >= 0 && index < profiles.length) {
      profile = profiles[index];
    }
  }

  return profile;
}

async function addSchedule(profileId: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    if (!remoteConfig.profiles || remoteConfig.profiles.length === 0) {
      throw new Error('No profiles found. Run: openfam profiles add <name> first');
    }

    const profile = findProfile(remoteConfig.profiles, profileId);
    if (!profile) {
      const availableNames = remoteConfig.profiles.map(p => p.name).join(', ');
      throw new Error(`Profile "${profileId}" not found. Available: ${availableNames} (or use 1-${remoteConfig.profiles.length})`);
    }

    const available = Object.keys(remoteConfig.nextdns.profiles);
    const nextdnsChoices = available.map(key => ({
      name: `${key} - ${remoteConfig.nextdns.profiles[key].name}`,
      value: key
    }));

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'days',
        message: 'Select days:',
        choices: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        validate: (i: string[]) => i.length > 0 || 'Select at least one day'
      },
      {
        type: 'input',
        name: 'timeStart',
        message: 'Start time (HH:MM):',
        validate: (i: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(i) || 'Invalid format'
      },
      {
        type: 'input',
        name: 'timeEnd',
        message: 'End time (HH:MM):',
        validate: (i: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(i) || 'Invalid format'
      },
      {
        type: 'list',
        name: 'nextdns',
        message: 'NextDNS profile:',
        choices: nextdnsChoices
      }
    ]);

    profile.schedule.push({
      days: answers.days,
      time_start: answers.timeStart,
      time_end: answers.timeEnd,
      nextdns: answers.nextdns
    });

    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Schedule added to "${profile.name}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function removeSchedule(profileId: string, scheduleIndex: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    if (!remoteConfig.profiles || remoteConfig.profiles.length === 0) {
      throw new Error('No profiles found');
    }

    const profile = findProfile(remoteConfig.profiles, profileId);
    if (!profile) {
      const availableNames = remoteConfig.profiles.map(p => p.name).join(', ');
      throw new Error(`Profile "${profileId}" not found. Available: ${availableNames} (or use 1-${remoteConfig.profiles.length})`);
    }

    const schedIdx = parseInt(scheduleIndex) - 1;

    if (schedIdx < 0 || schedIdx >= profile.schedule.length) {
      throw new Error('Invalid schedule index');
    }

    profile.schedule.splice(schedIdx, 1);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Schedule removed from "${profile.name}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function showSchedule(profileId: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    if (!remoteConfig.profiles || remoteConfig.profiles.length === 0) {
      throw new Error('No profiles found');
    }

    const profile = findProfile(remoteConfig.profiles, profileId);
    if (!profile) {
      const availableNames = remoteConfig.profiles.map(p => p.name).join(', ');
      throw new Error(`Profile "${profileId}" not found. Available: ${availableNames} (or use 1-${remoteConfig.profiles.length})`);
    }

    console.log(chalk.cyan(`\nSchedule for "${profile.name}":\n`));
    console.log(chalk.white(`Default: ${profile.default_nextdns}\n`));

    if (profile.schedule.length === 0) {
      console.log(chalk.gray('No scheduled overrides\n'));
      return;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      process.stdout.write(chalk.white(`${day}: `));
      const daySchedules = profile.schedule.filter((s: any) => s.days.includes(day));
      if (daySchedules.length === 0) {
        process.stdout.write(chalk.gray('Default\n'));
      } else {
        daySchedules.sort((a: any, b: any) => a.time_start.localeCompare(b.time_start));
        daySchedules.forEach((s: any) => {
          process.stdout.write(chalk.cyan(`${s.time_start}-${s.time_end} → ${s.nextdns}  `));
        });
        process.stdout.write('\n');
      }
    });
    console.log();
  } finally {
    ssh.disconnect();
  }
}
