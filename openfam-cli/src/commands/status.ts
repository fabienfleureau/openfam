import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show agent status')
    .action(async () => {
      const config = loadSSHConfig();
      const ssh = new SSHClient(config);
      const router = new RouterService(ssh);

      try {
        await ssh.connect();
        console.log(chalk.cyan('\nOpenFAM Status\n'));

        const agentCheck = await ssh.exec('ls /etc/openfam/agent.sh 2>/dev/null');
        if (agentCheck.exitCode === 0) {
          console.log(chalk.green('✓ Agent installed'));
        } else {
          console.log(chalk.red('✗ Agent not installed'));
          ssh.disconnect();
          return;
        }

        const cronCheck = await ssh.exec('pgrep crond 2>/dev/null || ps | grep -v grep | grep crond');
        if (cronCheck.stdout.trim().length > 0) {
          console.log(chalk.green('✓ Cron service running'));
        } else {
          console.log(chalk.yellow('! Cron service (crond) not running. Agent will not poll.'));
        }

        const cronJobCheck = await ssh.exec('crontab -l 2>/dev/null | grep "openfam/agent.sh"');
        if (cronJobCheck.stdout.trim().length > 0) {
          console.log(chalk.green('✓ Cron job configured'));
        } else {
          console.log(chalk.red('✗ Cron job not configured. Run "openfam install" again.'));
        }

        const lastCmd = await router.getAgentStatus();
        console.log(chalk.gray('\nLast NextDNS command:'));
        console.log(chalk.white(lastCmd || 'None'));

        console.log(chalk.gray('\nFile Integrity:'));
        const filesToCheck = [
          '/etc/openfam/agent.sh',
          '/etc/openfam/lib/config.sh',
          '/etc/openfam/lib/log.sh',
          '/etc/openfam/lib/nextdns.sh',
          '/etc/openfam/lib/schedule.sh',
          '/etc/openfam/config.json'
        ];

        for (const file of filesToCheck) {
          const check = await ssh.exec(`ls ${file} 2>/dev/null`);
          if (check.exitCode === 0) {
            console.log(chalk.green(`✓ ${file}`));
          } else {
            console.log(chalk.red(`✗ ${file} (MISSING)`));
          }
        }

        const jqCheck = await ssh.exec('which jq');
        if (jqCheck.exitCode === 0) {
          console.log(chalk.green('✓ jq binary found'));
        } else {
          console.log(chalk.red('✗ jq binary NOT FOUND (required for JSON)'));
        }

        const remoteConfig = await router.downloadConfig();
        if (remoteConfig) {
          console.log(chalk.gray('\nConfiguration:'));
          console.log(chalk.white(`  Timezone: ${remoteConfig.general.timezone}`));
          console.log(chalk.white(`  Default: ${remoteConfig.general.nextdns_default_profile}`));
          console.log(chalk.white(`  Profiles: ${remoteConfig.profiles.length}`));
          console.log(chalk.white(`  NextDNS profiles: ${Object.keys(remoteConfig.nextdns.profiles).length}`));
        }

        console.log(chalk.gray('\nRecent activity:'));
        const logs = await router.tailLogs(5);
        console.log(logs);
        console.log();
      } finally {
        ssh.disconnect();
      }
    });
}
