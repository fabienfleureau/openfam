import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig as loadSSHConfig } from '../config.js';
import type { Config } from '../types/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
import agentScript from '../../../fam-agent/agent.sh';
// @ts-ignore
import configLib from '../../../fam-agent/lib/config.sh';
// @ts-ignore
import scheduleLib from '../../../fam-agent/lib/schedule.sh';
// @ts-ignore
import nextdnsLib from '../../../fam-agent/lib/nextdns.sh';
// @ts-ignore
import logLib from '../../../fam-agent/lib/log.sh';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createInstallCommand(): Command {
  return new Command('install')
    .description('Install OpenFAM agent on OpenWrt router')
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

      console.log(chalk.cyan('\nInstalling OpenFAM...\n'));

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
        const existingConfig = await router.downloadConfig();
        let shouldUploadConfig = true;

        if (existingConfig) {
          try {
            ConfigManager.validateConfig(existingConfig);
            const { confirmOverride } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirmOverride',
                message: 'An existing config was found on the router. Do you want to override it with a new one?',
                default: false
              }
            ]);
            shouldUploadConfig = confirmOverride;
          } catch (validationError) {
            console.log(chalk.yellow(`   ! Existing config is invalid: ${validationError instanceof Error ? validationError.message : String(validationError)}`));
            const { confirmOverride } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirmOverride',
                message: 'The existing config is invalid and may cause issues. Do you want to override it with a NEW valid one?',
                default: true
              }
            ]);
            shouldUploadConfig = confirmOverride;
          }
        }

        if (shouldUploadConfig) {
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
              nextdns_default_profile: answers.profileId
            },
            nextdns: {
              profiles: {
                [answers.profileId]: {
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
        } else {
          console.log(chalk.yellow('   ! Skipping config creation (keeping existing)'));
        }

        console.log(chalk.gray('5. Uploading agent files...'));
        await router.uploadContent(agentScript, '/etc/openfam/agent.sh');
        await router.uploadContent(configLib, '/etc/openfam/lib/config.sh');
        await router.uploadContent(scheduleLib, '/etc/openfam/lib/schedule.sh');
        await router.uploadContent(nextdnsLib, '/etc/openfam/lib/nextdns.sh');
        await router.uploadContent(logLib, '/etc/openfam/lib/log.sh');
        console.log(chalk.green('   ✓ Agent files uploaded (bundled)'));

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
