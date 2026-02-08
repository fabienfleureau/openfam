import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SSHClient } from '../ssh/client.js';
import { loadConfig } from '../config.js';
import { debug, debugObject } from '../utils/logger.js';

export function createAuthCommand(): Command {
  const cmd = new Command('auth');
  cmd.description('Authentication and connection commands');

  const checkCmd = new Command('check')
    .description('Check authentication and connectivity to the OpenWrt router')
    .action(async () => {
      const spinner = ora('Connecting to router...').start();

      try {
        const config = loadConfig();
        debug('Loaded configuration');
        debugObject('Config', { ...config, sshKeyPath: config.sshKeyPath ? '***' : undefined });

        const client = new SSHClient(config);

        spinner.text = `Connecting to ${config.routerIp}...`;
        debug(`Attempting SSH connection to ${config.username}@${config.routerIp}:${config.routerPort}`);
        await client.connect();
        debug('SSH connection established');

        spinner.text = 'Verifying access...';

        // Test basic command to verify we have proper access
        debug('Executing: uname -a');
        const result = await client.exec('uname -a');
        debug(`Command result: exitCode=${result.exitCode}, stdout="${result.stdout.trim()}"`);

        if (result.exitCode === 0) {
          spinner.succeed(chalk.green('Successfully connected to router!'));

          // Display router info
          console.log(chalk.dim('─'.repeat(50)));
          console.log(chalk.bold('Router Information:'));
          console.log(chalk.dim('─'.repeat(50)));
          console.log(`${chalk.cyan('IP Address:')}      ${config.routerIp}`);
          console.log(`${chalk.cyan('Username:')}        ${config.username}`);
          console.log(`${chalk.cyan('System Info:')}     ${result.stdout.trim()}`);

          // Get UCI version to confirm OpenWrt
          debug('Executing: uci version');
          const uciResult = await client.exec('uci version');
          if (uciResult.exitCode === 0) {
            console.log(`${chalk.cyan('UCI Version:')}      ${uciResult.stdout.trim()}`);
            debug(`UCI version: ${uciResult.stdout.trim()}`);
          }

          client.disconnect();
          debug('Disconnected from router');
          process.exit(0);
        } else {
          spinner.fail(chalk.red('Connection succeeded but command execution failed'));
          console.error(chalk.red(`Error: ${result.stderr}`));
          debug(`Command error: ${result.stderr}`);
          client.disconnect();
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to connect to router'));
        console.error(chalk.dim('─'.repeat(50)));

        if (error instanceof Error) {
          debug(`Connection error: ${error.message}`);
          debug(`Error stack: ${error.stack}`);

          if (error.message.includes('ECONNREFUSED')) {
            console.error(chalk.red('Connection refused. Check:'));
            console.error(chalk.dim('  • Router IP address is correct'));
            console.error(chalk.dim('  • Router is powered on'));
            console.error(chalk.dim('  • SSH service is enabled on router'));
          } else if (error.message.includes('All configured authentication') || error.message.includes('SSH key')) {
            console.error(chalk.red('Authentication failed. Check:'));
            console.error(chalk.dim('  • SSH key path is correct in .env'));
            console.error(chalk.dim('  • SSH key exists at that path'));
            console.error(chalk.dim('  • Router has your public key in ~/.ssh/authorized_keys'));
          } else if (error.message.includes('Timed out')) {
            console.error(chalk.red('Connection timed out. Check:'));
            console.error(chalk.dim('  • Router is on the same network'));
            console.error(chalk.dim('  • Firewall is not blocking SSH'));
            console.error(chalk.dim('  • Router IP address is correct'));
          } else {
            console.error(chalk.red(`Error: ${error.message}`));
          }
        }

        process.exit(1);
      }
    });

  cmd.addCommand(checkCmd);
  return cmd;
}
