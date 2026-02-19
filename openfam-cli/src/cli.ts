#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAuthCommand } from './commands/auth.js';
import { createDevicesCommand } from './commands/devices.js';
import { createInstallCommand } from './commands/install.js';
import { createProfilesCommand } from './commands/profiles.js';
import { createNextDNSCommand } from './commands/nextdns.js';
import { createScheduleCommand } from './commands/schedule.js';
import { createLogsCommand } from './commands/logs.js';
import { createStatusCommand } from './commands/status.js';
import { setDebug } from './utils/logger.js';

const program = new Command();

program
  .name('openfam')
  .description('Open-F.A.M. CLI - Installer and management tool for OpenWrt parental control')
  .version('0.1.0')
  .option('-d, --debug', 'enable verbose debug output (may expose sensitive information)');

// Add command groups
program.addCommand(createAuthCommand());
program.addCommand(createDevicesCommand());
program.addCommand(createInstallCommand());
program.addCommand(createProfilesCommand());
program.addCommand(createNextDNSCommand());
program.addCommand(createScheduleCommand());
program.addCommand(createLogsCommand());
program.addCommand(createStatusCommand());

// Default action - show help if no command provided
program.action(() => {
  console.log(chalk.cyan('\n  Open-F.A.M. - "The smart heart of your family\'s network"\n'));
  program.help();
});

program.parse();

// Set debug mode from global options and show warning
const options = program.opts();
if (options.debug) {
  console.warn(chalk.yellow('⚠️  Debug mode enabled: Detailed output will be shown, including command details and error stack traces.\n'));
}
setDebug(!!options.debug);
