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
        console.log(chalk.cyan('\nOpen-F.A.M. Status\n'));

        const agentCheck = await ssh.exec('ls /etc/fam/agent.sh 2>/dev/null');
        if (agentCheck.exitCode === 0) {
          console.log(chalk.green('✓ Agent installed'));
        } else {
          console.log(chalk.red('✗ Agent not installed'));
          ssh.disconnect();
          return;
        }

        const lastCmd = await router.getAgentStatus();
        console.log(chalk.gray('\nLast NextDNS command:'));
        console.log(chalk.white(lastCmd));

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
