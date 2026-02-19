import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createLogsCommand(): Command {
  return new Command('logs')
    .description('View agent logs')
    .option('-t, --tail', 'Tail logs')
    .option('-n, --lines <number>', 'Number of lines', '50')
    .action(async (options) => {
      const config = loadSSHConfig();
      const ssh = new SSHClient(config);
      const router = new RouterService(ssh);

      try {
        await ssh.connect();

        if (options.tail) {
          console.log(chalk.gray('\nTailing /etc/fam/logs/fam.log (Ctrl+C to exit):\n'));
          await ssh.exec('tail -f /etc/fam/logs/fam.log 2>/dev/null || echo "No logs yet"');
        } else {
          const logs = await router.tailLogs(parseInt(options.lines));
          console.log(chalk.gray('\nRecent logs:\n'));
          console.log(logs);
          console.log();
        }
      } finally {
        if (!options.tail) ssh.disconnect();
      }
    });
}
