import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig as loadSSHConfig } from '../config.js';
import type { Config } from '../types/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createInstallCommand(): Command {
  return new Command('install')
    .description('Install Open-F.A.M. agent on OpenWrt router')
    .option('--check', 'Only check connectivity')
    .action(async (options) => {
      const config = loadSSHConfig();
      const ssh = new SSHClient(config);
      const router = new RouterService(ssh);

      if (options.check) {
        console.log(chalk.cyan('Checking connectivity...'));
        try {
          await ssh.connect();
          const connected = await router.checkConnectivity();
          if (connected) {
            console.log(chalk.green('✓ Router reachable'));
            const tz = await router.getRouterTimezone();
            console.log(chalk.gray(`  Timezone: ${tz}`));
          } else {
            console.log(chalk.red('✗ Router not reachable'));
            process.exit(1);
          }
        } catch (error) {
          console.log(chalk.red(`✗ ${error instanceof Error ? error.message : String(error)}`));
          process.exit(1);
        } finally {
          ssh.disconnect();
        }
        return;
      }

      console.log(chalk.cyan('\nInstalling Open-F.A.M...\n'));

      try {
        console.log(chalk.gray('1. Connecting...'));
        await ssh.connect();
        console.log(chalk.green('   ✓ Connected'));

        console.log(chalk.gray('2. Installing dependencies...'));
        await router.installDependencies();
        console.log(chalk.green('   ✓ Installed nextdns, jq'));

        console.log(chalk.gray('3. Creating directories...'));
        await router.createFamDirectory();
        console.log(chalk.green('   ✓ Directories created'));

        console.log(chalk.gray('4. Configuring NextDNS...'));
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'profileId',
            message: 'NextDNS Profile ID:',
            validate: (i: string) => i.trim().length > 0 || 'Required'
          },
          {
            type: 'input',
            name: 'profileName',
            message: 'Profile name:',
            default: 'Default'
          }
        ]);

        const routerTz = await router.getRouterTimezone();
        const initialConfig: Config = {
          general: {
            timezone: routerTz,
            nextdns_default_profile: 'default'
          },
          nextdns: {
            profiles: {
              default: {
                id: answers.profileId,
                name: answers.profileName,
                link: `https://my.nextdns.io/profile/${answers.profileId}`
              }
            }
          },
          profiles: []
        };

        await router.uploadConfig(initialConfig);
        console.log(chalk.green('   ✓ Config created'));

        console.log(chalk.gray('5. Uploading agent files...'));
        // Find fam-agent directory relative to this file
        const repoRoot = path.resolve(__dirname, '../..');
        const agentPath = path.join(repoRoot, '../fam-agent');
        await router.uploadAgentFile(`${agentPath}/agent.sh`, '/etc/fam/agent.sh');
        await router.uploadAgentFile(`${agentPath}/lib/config.sh`, '/etc/fam/lib/config.sh');
        await router.uploadAgentFile(`${agentPath}/lib/schedule.sh`, '/etc/fam/lib/schedule.sh');
        await router.uploadAgentFile(`${agentPath}/lib/nextdns.sh`, '/etc/fam/lib/nextdns.sh');
        await router.uploadAgentFile(`${agentPath}/lib/log.sh`, '/etc/fam/lib/log.sh');
        console.log(chalk.green('   ✓ Agent files uploaded'));

        console.log(chalk.gray('6. Setting up cron...'));
        await router.setupCron();
        console.log(chalk.green('   ✓ Cron configured'));

        console.log(chalk.green('\n✓ Installation complete!\n'));
        console.log(chalk.gray('Next steps:'));
        console.log(chalk.gray('  openfam profiles add'));
        console.log(chalk.gray('  openfam devices scan\n'));

      } catch (error) {
        console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
      } finally {
        ssh.disconnect();
      }
    });
}
