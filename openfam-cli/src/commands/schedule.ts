import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createScheduleCommand(): Command {
  const cmd = new Command('schedule').description('Manage schedules');

  cmd.command('add <profileId>').description('Add schedule').action(addSchedule);
  cmd.command('remove <profileId> <index>').description('Remove schedule').action(removeSchedule);
  cmd.command('show <profileId>').description('Show schedule').action(showSchedule);

  return cmd;
}

async function addSchedule(profileId: string): Promise<void> {
  const config = loadSSHConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const index = parseInt(profileId) - 1;
    if (index < 0 || index >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[index];
    const available = Object.keys(remoteConfig.nextdns.profiles);

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
        choices: available
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

    const idx = parseInt(profileId) - 1;
    if (idx < 0 || idx >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[idx];
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

    const idx = parseInt(profileId) - 1;
    if (idx < 0 || idx >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[idx];
    console.log(chalk.cyan(`\nSchedule for "${profile.name}":\n`));
    console.log(chalk.white(`Default: ${profile.default_nextdns}\n`));

    if (profile.schedule.length === 0) {
      console.log(chalk.gray('No scheduled overrides\n'));
      return;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      process.stdout.write(chalk.white(`${day}: `));
      const daySchedules = profile.schedule.filter(s => s.days.includes(day));
      if (daySchedules.length === 0) {
        process.stdout.write(chalk.gray('Default\n'));
      } else {
        daySchedules.sort((a, b) => a.time_start.localeCompare(b.time_start));
        daySchedules.forEach(s => {
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
