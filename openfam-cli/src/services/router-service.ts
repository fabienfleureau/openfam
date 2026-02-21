import { SSHClient } from '../ssh/client.js';
import type { Config } from '../types/config.js';
import { ConfigManager } from './config-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Try ip neigh first (OpenWrt), fallback to arp -n
    const result = await this.ssh.exec('ip neigh 2>/dev/null || arp -n 2>/dev/null');
    const devices: Array<{ mac: string; ip?: string }> = [];

    for (const line of result.stdout.split('\n')) {
      const parts = line.trim().split(/\s+/);

      // ip neigh format: IP dev INTERFACE lladdr MAC STATE
      // arp -n format: IP HWtype Flags HWaddress Mask Device
      if (parts.length >= 5) {
        const ip = parts[0];

        // Find MAC address in different positions
        let mac: string | undefined;
        const lladdrIndex = parts.indexOf('lladdr');
        if (lladdrIndex !== -1 && lladdrIndex + 1 < parts.length) {
          mac = parts[lladdrIndex + 1];
        } else if (parts.length >= 4 && parts[3].includes(':')) {
          mac = parts[3];
        }

        if (mac && mac !== '(incomplete)' && mac.includes(':') && mac.match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
          devices.push({ mac: mac.toUpperCase(), ip });
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
