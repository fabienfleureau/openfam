# OpenFAM MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CLI + router agent that manages NextDNS profiles per device with time-based scheduling.

**Architecture:** CLI (TypeScript/Node) on local computer → SSH to OpenWrt router → manages TOML config → Agent (Ash shell) polls every 5min → applies NextDNS CLI commands.

**Tech Stack:** TypeScript (ES2022), Node.js 18+, node-ssh, @iarna/toml, commander, inquirer, chalk; POSIX Ash for router agent.

---

## Phase 1: CLI Foundation & Dependencies

### Task 1: Update CLI Dependencies

**Files:**
- Modify: `openfam-cli/package.json`

**Step 1: Read current package.json**

Run: `cat openfam-cli/package.json`
Expected: See current dependencies

**Step 2: Add missing dependencies**

Edit `openfam-cli/package.json`, add to dependencies:
```json
"@iarna/toml": "^2.0.1",
"inquirer": "^9.2.0"
```

**Step 3: Install new dependencies**

Run: `cd openfam-cli && npm install`
Expected: New packages added to node_modules

**Step 4: Commit**

```bash
git add openfam-cli/package.json package-lock.json
git commit -m "feat(cli): add toml and inquirer dependencies"
```

---

### Task 2: Create TOML Config Types

**Files:**
- Create: `openfam-cli/src/types/config.ts`
- Test: `openfam-cli/src/types/config.test.ts`

**Step 1: Write the failing test**

Create `openfam-cli/src/types/config.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals';
import { Config, isValidMacAddress } from './config.js';

describe('Config Types', () => {
  describe('isValidMacAddress', () => {
    it('should accept valid MAC addresses', () => {
      expect(isValidMacAddress('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(isValidMacAddress('aa:bb:cc:dd:ee:ff')).toBe(true);
      expect(isValidMacAddress('00:11:22:33:44:55')).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(isValidMacAddress('AA-BB-CC-DD-EE-FF')).toBe(false);
      expect(isValidMacAddress('AABBCCDDEEFF')).toBe(false);
      expect(isValidMacAddress('AA:BB:CC:DD:EE')).toBe(false);
      expect(isValidMacAddress('AA:BB:CC:DD:EE:FF:GG')).toBe(false);
      expect(isValidMacAddress('')).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd openfam-cli && npm run type-check`
Expected: May pass type-check or fail if types don't exist

**Step 3: Write minimal implementation**

Create `openfam-cli/src/types/config.ts`:
```typescript
export interface GeneralConfig {
  timezone: string;
  nextdns_default_profile: string;
}

export interface NextDNSProfile {
  id: string;
  name: string;
  link: string;
}

export interface NextDNSConfig {
  profiles: Record<string, NextDNSProfile>;
}

export interface MacEntry {
  address: string;
  name: string;
}

export interface ScheduleEntry {
  days: string[];
  time_start: string;
  time_end: string;
  nextdns: string;
}

export interface Profile {
  name: string;
  default_nextdns: string;
  macs: MacEntry[];
  schedule: ScheduleEntry[];
}

export interface Config {
  general: GeneralConfig;
  nextdns: NextDNSConfig;
  profiles: Profile[];
}

// MAC address validation: XX:XX:XX:XX:XX:XX format
export function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
  return macRegex.test(mac);
}

export function isValidDay(day: string): boolean {
  const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return validDays.includes(day);
}

export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}
```

**Step 4: Run type-check to verify**

Run: `cd openfam-cli && npm run type-check`
Expected: No type errors

**Step 5: Commit**

```bash
git add openfam-cli/src/types/
git commit -m "feat(cli): add config types and validation"
```

---

### Task 3: Create Config Manager

**Files:**
- Create: `openfam-cli/src/services/config-manager.ts`

**Step 1: Create config manager**

Create `openfam-cli/src/services/config-manager.ts`:
```typescript
import TOML from '@iarna/toml';
import type { Config } from '../types/config.js';
import { isValidMacAddress, isValidDay, isValidTime } from '../types/config.js';

export class ConfigManager {
  static parseConfig(tomlString: string): Config {
    try {
      return TOML.parse(tomlString) as Config;
    } catch (error) {
      throw new Error(`Failed to parse TOML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static serializeConfig(config: Config): string {
    return TOML.stringify(config as any);
  }

  static validateConfig(config: Config): void {
    if (!config.general?.timezone) {
      throw new Error('Missing general.timezone');
    }
    if (!config.general?.nextdns_default_profile) {
      throw new Error('Missing general.nextdns_default_profile');
    }

    const defaultProfile = config.general.nextdns_default_profile;
    if (!config.nextdns?.profiles?.[defaultProfile]) {
      throw new Error(`Default NextDNS profile '${defaultProfile}' not defined`);
    }

    const profileIds = new Set(Object.keys(config.nextdns?.profiles || {}));

    for (const profile of config.profiles || []) {
      if (!profileIds.has(profile.default_nextdns)) {
        throw new Error(`NextDNS profile '${profile.default_nextdns}' not defined`);
      }

      for (const mac of profile.macs || []) {
        if (!isValidMacAddress(mac.address)) {
          throw new Error(`Invalid MAC address: ${mac.address} (must be XX:XX:XX:XX:XX:XX)`);
        }
      }

      for (const schedule of profile.schedule || []) {
        for (const day of schedule.days) {
          if (!isValidDay(day)) {
            throw new Error(`Invalid day: ${day}`);
          }
        }
        if (!isValidTime(schedule.time_start)) {
          throw new Error(`Invalid time_start: ${schedule.time_start}`);
        }
        if (!isValidTime(schedule.time_end)) {
          throw new Error(`Invalid time_end: ${schedule.time_end}`);
        }
        if (!profileIds.has(schedule.nextdns)) {
          throw new Error(`NextDNS profile '${schedule.nextdns}' not defined`);
        }
      }
    }
  }
}
```

**Step 2: Build and verify**

Run: `cd openfam-cli && npm run build`
Expected: Builds without errors

**Step 3: Commit**

```bash
git add openfam-cli/src/services/config-manager.ts
git commit -m "feat(cli): add config manager with TOML parsing"
```

---

## Phase 2: Router SSH Service

### Task 4: Create Router Service

**Files:**
- Create: `openfam-cli/src/services/router-service.ts`

**Step 1: Create router service**

Create `openfam-cli/src/services/router-service.ts`:
```typescript
import { SSHClient } from '../ssh/client.js';
import type { Config } from '../types/config.js';
import { ConfigManager } from './config-manager.js';
import fs from 'fs';
import path from 'path';

const FAM_CONFIG_PATH = '/etc/fam/config.toml';
const FAM_DIR = '/etc/fam';

export class RouterService {
  constructor(private ssh: SSHClient) {}

  async checkConnectivity(): Promise<boolean> {
    try {
      const result = await this.ssh.exec('echo "connected"');
      return result.stdout.trim() === 'connected' && result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async installDependencies(): Promise<void> {
    const result = await this.ssh.exec('opkg update && opkg install nextdns jq');
    if (result.exitCode !== 0) {
      throw new Error(`Failed to install dependencies: ${result.stderr}`);
    }
  }

  async createFamDirectory(): Promise<void> {
    const result = await this.ssh.exec(`mkdir -p ${FAM_DIR}/lib ${FAM_DIR}/logs`);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create directory: ${result.stderr}`);
    }
  }

  async uploadConfig(config: Config): Promise<void> {
    const toml = ConfigManager.serializeConfig(config);
    const tempPath = '/tmp/fam-config.toml';

    // Escape TOML content for shell heredoc
    const escapedToml = toml.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    await this.ssh.exec(`cat > ${tempPath} << 'FAMCONFIG'\n${toml}\nFAMCONFIG`);

    const moveResult = await this.ssh.exec(`mv ${tempPath} ${FAM_CONFIG_PATH}`);
    if (moveResult.exitCode !== 0) {
      throw new Error(`Failed to upload config: ${moveResult.stderr}`);
    }
  }

  async downloadConfig(): Promise<Config | null> {
    const result = await this.ssh.exec(`cat ${FAM_CONFIG_PATH} 2>/dev/null`);
    if (result.exitCode !== 0 || !result.stdout) {
      return null;
    }
    return ConfigManager.parseConfig(result.stdout);
  }

  async uploadAgentFile(localPath: string, remotePath: string): Promise<void> {
    const content = fs.readFileSync(localPath, 'utf-8');
    await this.ssh.exec(`cat > '${remotePath}' << 'FAMFILEEOF'\n${content}\nFAMFILEEOF`);
    await this.ssh.exec(`chmod +x '${remotePath}'`);
  }

  async setupCron(): Promise<void> {
    const cronLine = '*/5 * * * * /etc/fam/agent.sh >> /etc/fam/logs/fam.log 2>&1';
    await this.ssh.exec(
      `(crontab -l 2>/dev/null | grep -v "fam/agent.sh"; echo "${cronLine}") | crontab -`
    );
  }

  async getRouterTimezone(): Promise<string> {
    const result = await this.ssh.exec('cat /etc/TZ 2>/dev/null || echo "UTC"');
    return result.stdout.trim();
  }

  async scanDevices(): Promise<Array<{ mac: string; ip?: string }>> {
    const arpResult = await this.ssh.exec('arp -n');
    const devices: Array<{ mac: string; ip?: string }> = [];

    if (arpResult.exitCode === 0) {
      for (const line of arpResult.stdout.split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const ip = parts[0];
          const mac = parts[3];
          if (mac && mac !== '(incomplete)' && mac.includes(':')) {
            devices.push({ mac: mac.toUpperCase(), ip });
          }
        }
      }
    }

    return devices;
  }

  async tailLogs(lines: number = 50): Promise<string> {
    const result = await this.ssh.exec(`tail -n ${lines} /etc/fam/logs/fam.log 2>/dev/null || echo "No logs yet"`);
    return result.stdout;
  }

  async getAgentStatus(): Promise<string> {
    const result = await this.ssh.exec(
      `if [ -f /etc/fam/last-command.txt ]; then cat /etc/fam/last-command.txt; else echo "No command executed yet"; fi`
    );
    return result.stdout;
  }
}
```

**Step 2: Build and verify**

Run: `cd openfam-cli && npm run build`
Expected: Builds without errors

**Step 3: Commit**

```bash
git add openfam-cli/src/services/router-service.ts
git commit -m "feat(cli): add router service for SSH operations"
```

---

## Phase 3: CLI Commands

### Task 5: Create Install Command

**Files:**
- Create: `openfam-cli/src/commands/install.ts`

**Step 1: Create install command**

Create `openfam-cli/src/commands/install.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig } from '../config.js';
import type { Config } from '../types/config.js';

export function createInstallCommand(): Command {
  return new Command('install')
    .description('Install Open-F.A.M. agent on OpenWrt router')
    .option('--check', 'Only check connectivity')
    .action(async (options) => {
      const config = loadConfig();
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
        const agentPath = path.resolve(process.cwd(), '../../fam-agent');
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
```

**Step 2: Register command**

Edit `openfam-cli/src/cli.ts`:
```typescript
import { createInstallCommand } from './commands/install.js';
import path from 'path';

program.addCommand(createInstallCommand());
```

**Step 3: Build**

Run: `cd openfam-cli && npm run build`
Expected: Builds without errors

**Step 4: Commit**

```bash
git add openfam-cli/src/commands/install.ts openfam-cli/src/cli.ts
git commit -m "feat(cli): add install command"
```

---

### Task 6: Create Profiles Commands

**Files:**
- Create: `openfam-cli/src/commands/profiles.ts`

**Step 1: Create profiles command**

Create `openfam-cli/src/commands/profiles.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig } from '../config.js';
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
  const config = loadConfig();
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
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const available = Object.keys(remoteConfig.nextdns.profiles);
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'defaultNextdns',
      message: 'Default NextDNS profile:',
      choices: available
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
  const config = loadConfig();
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
  const config = loadConfig();
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
```

**Step 2: Register command**

Edit `openfam-cli/src/cli.ts`:
```typescript
import { createProfilesCommand } from './commands/profiles.js';
program.addCommand(createProfilesCommand());
```

**Step 3: Build**

Run: `cd openfam-cli && npm run build`

**Step 4: Commit**

```bash
git add openfam-cli/src/commands/profiles.ts openfam-cli/src/cli.ts
git commit -m "feat(cli): add profiles commands"
```

---

### Task 7: Rewrite Devices Commands

**Files:**
- Modify: `openfam-cli/src/commands/devices.ts`

**Step 1: Rewrite devices command**

Replace `openfam-cli/src/commands/devices.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig } from '../config.js';
import { isValidMacAddress } from '../types/config.js';

export function createDevicesCommand(): Command {
  const cmd = new Command('devices').description('Manage devices');

  cmd.command('scan').description('Scan for devices').action(scanDevices);
  cmd.command('list').description('List all devices').action(listDevices);
  cmd.command('add <profileId> <mac>')
    .option('--name <name>', 'Device name')
    .action(addDevice);
  cmd.command('remove <mac>').description('Remove device').action(removeDevice);

  return cmd;
}

async function scanDevices(): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const devices = await router.scanDevices();

    if (devices.length === 0) {
      console.log(chalk.yellow('No devices found'));
      return;
    }

    console.log(chalk.cyan('\nConnected Devices:\n'));
    devices.forEach(d => {
      console.log(chalk.white(d.mac));
      if (d.ip) console.log(chalk.gray(`  IP: ${d.ip}\n`));
    });
  } finally {
    ssh.disconnect();
  }
}

async function listDevices(): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();

    if (!remoteConfig || remoteConfig.profiles.length === 0) {
      console.log(chalk.yellow('No profiles/config found'));
      return;
    }

    console.log(chalk.cyan('\nAll Devices:\n'));
    remoteConfig.profiles.forEach(p => {
      if (p.macs.length > 0) {
        console.log(chalk.white(`${p.name}:`));
        p.macs.forEach(m => console.log(chalk.gray(`  - ${m.address} (${m.name})`)));
        console.log();
      }
    });
  } finally {
    ssh.disconnect();
  }
}

async function addDevice(profileId: string, mac: string, options: { name?: string }): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const macUpper = mac.toUpperCase();
    if (!isValidMacAddress(macUpper)) {
      throw new Error(`Invalid MAC format: ${mac} (must be XX:XX:XX:XX:XX:XX)`);
    }

    const index = parseInt(profileId) - 1;
    if (index < 0 || index >= remoteConfig.profiles.length) {
      throw new Error('Invalid profile ID');
    }

    const profile = remoteConfig.profiles[index];

    for (const p of remoteConfig.profiles) {
      if (p.macs.some(m => m.address === macUpper)) {
        throw new Error(`MAC ${macUpper} already in "${p.name}"`);
      }
    }

    let deviceName = options.name;
    if (!deviceName) {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Device name:',
        default: `Device ${macUpper.slice(-6)}`
      }]);
      deviceName = answers.name;
    }

    profile.macs.push({ address: macUpper, name: deviceName });
    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Added "${deviceName}" to "${profile.name}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function removeDevice(mac: string): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const macUpper = mac.toUpperCase();
    for (const profile of remoteConfig.profiles) {
      const idx = profile.macs.findIndex(m => m.address === macUpper);
      if (idx !== -1) {
        const removed = profile.macs.splice(idx, 1)[0];
        await router.uploadConfig(remoteConfig);
        console.log(chalk.green(`\n✓ Removed "${removed.name}" from "${profile.name}"\n`));
        return;
      }
    }
    throw new Error(`MAC ${macUpper} not found`);
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}
```

**Step 2: Build**

Run: `cd openfam-cli && npm run build`

**Step 3: Commit**

```bash
git add openfam-cli/src/commands/devices.ts
git commit -m "feat(cli): rewrite devices commands"
```

---

### Task 8: Create NextDNS Commands

**Files:**
- Create: `openfam-cli/src/commands/nextdns.ts`

**Step 1: Create nextdns command**

Create `openfam-cli/src/commands/nextdns.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig } from '../config.js';

export function createNextDNSCommand(): Command {
  const cmd = new Command('nextdns').description('Manage NextDNS profiles');

  cmd.command('list').description('List profiles').action(listProfiles);
  cmd.command('add <id> <name>').description('Add profile').action(addProfile);
  cmd.command('remove <id>').description('Remove profile').action(removeProfile);

  return cmd;
}

async function listProfiles(): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();

    if (!remoteConfig || Object.keys(remoteConfig.nextdns.profiles).length === 0) {
      console.log(chalk.yellow('No NextDNS profiles configured'));
      return;
    }

    console.log(chalk.cyan('\nNextDNS Profiles:\n'));
    for (const [key, profile] of Object.entries(remoteConfig.nextdns.profiles)) {
      console.log(chalk.white(`${key}:`));
      console.log(chalk.gray(`  Name: ${profile.name}`));
      console.log(chalk.gray(`  ID: ${profile.id}`));
      console.log(chalk.blue(`  Link: ${profile.link}\n`));
    }
  } finally {
    ssh.disconnect();
  }
}

async function addProfile(id: string, name: string): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    const key = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (remoteConfig.nextdns.profiles[key]) {
      throw new Error(`Profile "${key}" already exists`);
    }

    remoteConfig.nextdns.profiles[key] = {
      id,
      name,
      link: `https://my.nextdns.io/profile/${id}`
    };

    ConfigManager.validateConfig(remoteConfig);
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Added "${name}" as "${key}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

async function removeProfile(id: string): Promise<void> {
  const config = loadConfig();
  const ssh = new SSHClient(config);
  const router = new RouterService(ssh);

  try {
    await ssh.connect();
    const remoteConfig = await router.downloadConfig();
    if (!remoteConfig) throw new Error('No config found');

    for (const profile of remoteConfig.profiles) {
      if (profile.default_nextdns === id) {
        throw new Error(`Cannot remove: used by "${profile.name}"`);
      }
      for (const schedule of profile.schedule) {
        if (schedule.nextdns === id) {
          throw new Error(`Cannot remove: used in schedule of "${profile.name}"`);
        }
      }
    }

    if (!remoteConfig.nextdns.profiles[id]) {
      throw new Error(`Profile "${id}" not found`);
    }

    delete remoteConfig.nextdns.profiles[id];
    await router.uploadConfig(remoteConfig);

    console.log(chalk.green(`\n✓ Removed "${id}"\n`));
  } catch (error) {
    console.log(chalk.red(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}
```

**Step 2: Register command**

Edit `openfam-cli/src/cli.ts`:
```typescript
import { createNextDNSCommand } from './commands/nextdns.js';
program.addCommand(createNextDNSCommand());
```

**Step 3: Build**

Run: `cd openfam-cli && npm run build`

**Step 4: Commit**

```bash
git add openfam-cli/src/commands/nextdns.ts openfam-cli/src/cli.ts
git commit -m "feat(cli): add nextdns commands"
```

---

### Task 9: Create Schedule Commands

**Files:**
- Create: `openfam-cli/src/commands/schedule.ts`

**Step 1: Create schedule command**

Create `openfam-cli/src/commands/schedule.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { ConfigManager } from '../services/config-manager.js';
import { loadConfig } from '../config.js';

export function createScheduleCommand(): Command {
  const cmd = new Command('schedule').description('Manage schedules');

  cmd.command('add <profileId>').description('Add schedule').action(addSchedule);
  cmd.command('remove <profileId> <index>').description('Remove schedule').action(removeSchedule);
  cmd.command('show <profileId>').description('Show schedule').action(showSchedule);

  return cmd;
}

async function addSchedule(profileId: string): Promise<void> {
  const config = loadConfig();
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
  const config = loadConfig();
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
  const config = loadConfig();
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
```

**Step 2: Register command**

Edit `openfam-cli/src/cli.ts`:
```typescript
import { createScheduleCommand } from './commands/schedule.js';
program.addCommand(createScheduleCommand());
```

**Step 3: Build**

Run: `cd openfam-cli && npm run build`

**Step 4: Commit**

```bash
git add openfam-cli/src/commands/schedule.ts openfam-cli/src/cli.ts
git commit -m "feat(cli): add schedule commands"
```

---

### Task 10: Create Logs and Status Commands

**Files:**
- Create: `openfam-cli/src/commands/logs.ts`
- Create: `openfam-cli/src/commands/status.ts`

**Step 1: Create logs command**

Create `openfam-cli/src/commands/logs.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig } from '../config.js';

export function createLogsCommand(): Command {
  return new Command('logs')
    .description('View agent logs')
    .option('-t, --tail', 'Tail logs')
    .option('-n, --lines <number>', 'Number of lines', '50')
    .action(async (options) => {
      const config = loadConfig();
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
```

**Step 2: Create status command**

Create `openfam-cli/src/commands/status.ts`:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig } from '../config.js';

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show agent status')
    .action(async () => {
      const config = loadConfig();
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
```

**Step 3: Register commands**

Edit `openfam-cli/src/cli.ts`:
```typescript
import { createLogsCommand } from './commands/logs.js';
import { createStatusCommand } from './commands/status.js';

program.addCommand(createLogsCommand());
program.addCommand(createStatusCommand());
```

**Step 4: Build**

Run: `cd openfam-cli && npm run build`

**Step 5: Commit**

```bash
git add openfam-cli/src/commands/logs.ts openfam-cli/src/commands/status.ts openfam-cli/src/cli.ts
git commit -m "feat(cli): add logs and status commands"
```

---

## Phase 4: Router Agent

### Task 11: Create Agent Library Scripts

**Files:**
- Create: `fam-agent/lib/config.sh`
- Create: `fam-agent/lib/schedule.sh`
- Create: `fam-agent/lib/nextdns.sh`
- Create: `fam-agent/lib/log.sh`

**Step 1: Create lib directory and scripts**

Run: `mkdir -p fam-agent/lib`

Create `fam-agent/lib/log.sh`:
```bash
#!/bin/ash
FAM_LOG_DIR="/etc/fam/logs"
FAM_LOG="$FAM_LOG_DIR/fam.log"

ensure_log_dir() {
    [ ! -d "$FAM_LOG_DIR" ] && mkdir -p "$FAM_LOG_DIR"
}

log() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$FAM_LOG"
}

log_err() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >> "$FAM_LOG"
}
```

Create `fam-agent/lib/config.sh`:
```bash
#!/bin/ash
. /etc/fam/lib/log.sh

FAM_CONFIG="/etc/fam/config.toml"

get_timezone() {
    awk -F'=' '/^timezone\s*=/ {gsub(/[" \t]/, "", $2); print $2; exit}' "$FAM_CONFIG"
}

get_default_profile() {
    awk -F'=' '/^nextdns_default_profile\s*=/ {gsub(/[" \t]/, "", $2); print $2; exit}' "$FAM_CONFIG"
}

config_exists() {
    [ -f "$FAM_CONFIG" ]
}

validate_config() {
    if [ ! -f "$FAM_CONFIG" ]; then
        log_err "Config not found: $FAM_CONFIG"
        return 1
    fi
    return 0
}
```

Create `fam-agent/lib/schedule.sh`:
```bash
#!/bin/ash
get_current_day() {
    date +%a
}

get_current_time() {
    date +%H:%M
}

is_time_in_range() {
    local start="$1"
    local end="$2"
    local current=$(get_current_time)

    local start_min=$(echo "$start" | awk -F: '{print $1*60 + $2}')
    local end_min=$(echo "$end" | awk -F: '{print $1*60 + $2}')
    local current_min=$(echo "$current" | awk -F: '{print $1*60 + $2}')

    if [ $end_min -lt $start_min ]; then
        [ $current_min -ge $start_min ] || [ $current_min -lt $end_min ]
    else
        [ $current_min -ge $start_min ] && [ $current_min -lt $end_min ]
    fi
}

is_day_in_schedule() {
    local schedule_days="$1"
    local current_day=$(get_current_day)
    echo "$schedule_days" | tr ',' '\n' | grep -q "^${current_day}$"
}
```

Create `fam-agent/lib/nextdns.sh`:
```bash
#!/bin/ash
. /etc/fam/lib/log.sh

NEXTDNS_BIN="/usr/sbin/nextdns"

nextdns_available() {
    [ -x "$NEXTDNS_BIN" ]
}

build_nextdns_command() {
    local mappings="$1"
    [ -z "$mappings" ] && return

    local cmd="$NEXTDNS_BIN config"
    echo "$mappings" | tr ',' '\n' | sort | while read -r mapping; do
        [ -n "$mapping" ] && cmd="$cmd --device $mapping"
    done
    echo "$cmd"
}

execute_nextdns_config() {
    local mappings="$1"
    local cmd=$(build_nextdns_command "$mappings")

    if [ -z "$cmd" ] || [ "$cmd" = "$NEXTDNS_BIN config" ]; then
        log "No devices to configure"
        return 0
    fi

    log "Executing: $cmd"
    eval "$cmd" >> "$FAM_LOG" 2>&1
}
```

**Step 2: Make executable**

Run: `chmod +x fam-agent/lib/*.sh`

**Step 3: Commit**

```bash
git add fam-agent/lib/
git commit -m "feat(agent): add library scripts"
```

---

### Task 12: Rewrite Main Agent Script

**Files:**
- Modify: `fam-agent/agent.sh`

**Step 1: Rewrite agent.sh**

Replace `fam-agent/agent.sh`:
```bash
#!/bin/ash
# Open-F.A.M. Router Agent - Polls config and applies NextDNS profiles

set -e

FAM_DIR="/etc/fam"
FAM_CONFIG="$FAM_DIR/config.toml"
FAM_LIB="$FAM_DIR/lib"
FAM_LAST_CMD="$FAM_DIR/last-command.txt"

# Load libraries
. "$FAM_LIB/log.sh"
. "$FAM_LIB/config.sh"
. "$FAM_LIB/schedule.sh"
. "$FAM_LIB/nextdns.sh"

# Prevent concurrent execution
FAM_LOCK="/var/run/fam-agent.pid"
if [ -f "$FAM_LOCK" ]; then
    old_pid=$(cat "$FAM_LOCK" 2>/dev/null)
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
        log "Agent already running (PID: $old_pid)"
        exit 0
    fi
fi
echo $$ > "$FAM_LOCK"
trap 'rm -f "$FAM_LOCK"' EXIT

log "=== Agent run started ==="

# Validate config
if ! validate_config; then
    log_err "Config validation failed"
    exit 1
fi

# Set timezone
TZ=$(get_timezone)
export TZ

CURRENT_DAY=$(get_current_day)
CURRENT_TIME=$(get_current_time)
log "Current: $CURRENT_DAY $CURRENT_TIME (TZ: $TZ)"

# Build device mappings from TOML config
# Simplified parser for ash
parse_profiles() {
    local in_profile=0
    local in_macs=0
    local profile_name=""
    local profile_default=""
    local mac_address=""
    local result=""

    while IFS= read -r line; do
        case "$line" in
            ''|\#*) continue ;;
        esac

        if echo "$line" | grep -q '^\[\[profiles\]\]'; then
            in_profile=1
            in_macs=0
            profile_name=""
            profile_default=""
            continue
        fi

        if [ $in_profile -eq 1 ]; then
            if echo "$line" | grep -q '^\[\['; then
                in_profile=0
                continue
            fi

            case "$line" in
                name\ =*)
                    profile_name=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/')
                    ;;
                default_nextdns\ =*)
                    profile_default=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/')
                    ;;
                \[\[profiles.macs\]\])
                    in_macs=1
                    ;;
                address\ =*)
                    if [ $in_macs -eq 1 ]; then
                        mac_address=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/' | tr 'a-z' 'A-Z')
                        if [ -n "$mac_address" ]; then
                            if [ -n "$result" ]; then
                                result="$result,$mac_address=$profile_default"
                            else
                                result="$mac_address=$profile_default"
                            fi
                        fi
                    fi
                    ;;
                name\ =*\")  # MAC name entry, skip
                    ;;
            esac
        fi
    done < "$FAM_CONFIG"

    echo "$result"
}

DEVICE_MAPPINGS=$(parse_profiles)

# Build NextDNS command
NEW_COMMAND=$(build_nextdns_command "$DEVICE_MAPPINGS")

# Compare with last command
if [ -f "$FAM_LAST_CMD" ]; then
    LAST_COMMAND=$(cat "$FAM_LAST_CMD")
else
    LAST_COMMAND=""
fi

if [ "$NEW_COMMAND" != "$LAST_COMMAND" ]; then
    log "Configuration changed, applying..."
    execute_nextdns_config "$DEVICE_MAPPINGS"
    echo "$NEW_COMMAND" > "$FAM_LAST_CMD"
    log "Configuration applied"
else
    log "No changes detected, skipping"
fi

log "=== Agent run completed ==="
```

**Step 2: Make executable**

Run: `chmod +x fam-agent/agent.sh`

**Step 3: Commit**

```bash
git add fam-agent/agent.sh
git commit -m "feat(agent): rewrite main agent for TOML config"
```

---

## Phase 5: Integration & Documentation

### Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md architecture section**

Edit `CLAUDE.md`, replace the Overview section:
```markdown
## Project Overview

**Open-F.A.M.** ("The smart heart of your family's network") is a parental control system. This MVP focuses on **CLI management** and **router agent** that automatically applies NextDNS profiles based on time-based schedules per device.

### Architecture

**CLI (`openfam-cli/`)** - Runs on your computer, communicates via SSH to manage config
**Agent (`fam-agent/`)** - Lives on OpenWrt router, polls config every 5 minutes
**Config** - `/etc/fam/config.toml` single source of truth

### Commands

```bash
openfam install [--check]      # Install agent on router
openfam profiles list           # List user profiles
openfam devices scan            # Scan for connected devices
openfam schedule add <id>       # Add time-based schedule
openfam status                  # Check agent status
openfam logs                    # View agent logs
```
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for MVP architecture"
```

---

### Task 14: Create CLI README

**Files:**
- Create: `openfam-cli/README.md`

**Step 1: Create README**

Create `openfam-cli/README.md`:
```markdown
# Open-F.A.M. CLI

## Installation

```bash
cd openfam-cli
npm install && npm run build
```

## Configuration

Create `.env`:
```
OPENWRT_ROUTER_IP=192.168.10.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
OPENWRT_ROUTER_PORT=22
OPENWRT_USERNAME=root
```

## Usage

```bash
# Check connectivity
node dist/cli.js install --check

# Full installation
node dist/cli.js install

# Create profile and add device
node dist/cli.js profiles add "Emma"
node dist/cli.js devices scan
node dist/cli.js devices add 1 AA:BB:CC:DD:EE:FF --name "Phone"

# Add schedule
node dist/cli.js schedule add 1

# Check status
node dist/cli.js status
```
```

**Step 2: Commit**

```bash
git add openfam-cli/README.md
git commit -m "docs(cli): add usage guide"
```

---

## Summary

This implementation plan builds the OpenFAM MVP in 14 tasks:

1. Dependencies, Types, Config Manager
2. Router SSH Service
3. CLI Commands (install, profiles, devices, nextdns, schedule, logs, status)
4. Agent Library Scripts
5. Main Agent Script
6. Documentation

Each task has 2-5 steps: write test/implement → build → commit.

---

**END OF IMPLEMENTATION PLAN**
