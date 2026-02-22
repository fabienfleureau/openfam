import { SSHClient } from '../ssh/client.js';
import type { Config } from '../types/config.js';
import { ConfigManager } from './config-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAM_CONFIG_PATH = '/etc/openfam/config.json';
const FAM_DIR = '/etc/openfam';

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
    const json = ConfigManager.serializeConfig(config);

    // Write directly using echo with proper escaping
    // Split into chunks to avoid line length limits
    const lines = json.split('\n');
    const tempPath = '/tmp/fam-config.json';

    // Clear temp file first
    await this.ssh.exec(`echo -n > ${tempPath}`);

    // Write each line
    for (const line of lines) {
      // Escape special characters for shell
      const escapedLine = line
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`');
      await this.ssh.exec(`echo "${escapedLine}" >> ${tempPath}`);
    }

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

  async uploadContent(content: string, remotePath: string): Promise<void> {
    // Use a heredoc to write the content safely
    // We use 'FAMFILEEOF' as a delimiter
    await this.ssh.exec(`cat > '${remotePath}' << 'FAMFILEEOF'\n${content}\nFAMFILEEOF`);
    await this.ssh.exec(`chmod +x '${remotePath}'`);
  }

  async uploadAgentFile(localPath: string, remotePath: string): Promise<void> {
    const content = fs.readFileSync(localPath, 'utf-8');
    await this.uploadContent(content, remotePath);
  }

  async setupCron(): Promise<void> {
    const cronLine = '*/5 * * * * /etc/openfam/agent.sh >> /etc/openfam/logs/fam.log 2>&1';
    await this.ssh.exec(
      `(crontab -l 2>/dev/null | grep -v "fam/agent.sh"; echo "${cronLine}") | crontab -`
    );
    // Ensure crond is running and enabled
    await this.ssh.exec('/etc/init.d/cron enable && /etc/init.d/cron start');
  }

  async getRouterTimezone(): Promise<string> {
    const result = await this.ssh.exec('cat /etc/TZ 2>/dev/null || echo "UTC"');
    return result.stdout.trim();
  }

  async scanDevices(): Promise<Array<{ mac: string; ip?: string; hostname?: string; expiry?: number }>> {
    // Get current timestamp for filtering active DHCP leases
    const timeResult = await this.ssh.exec('date +%s');
    const currentTime = parseInt(timeResult.stdout.trim(), 10) || Math.floor(Date.now() / 1000);

    // Try ip neigh first (OpenWrt), fallback to arp -n
    const result = await this.ssh.exec('ip neigh 2>/dev/null || arp -n 2>/dev/null');
    const devicesMap = new Map<string, { mac: string; ip?: string; expiry?: number }>();

    for (const line of result.stdout.split('\n')) {
      const parts = line.trim().split(/\s+/);

      if (parts.length >= 5) {
        const ip = parts[0];
        let mac: string | undefined;
        const lladdrIndex = parts.indexOf('lladdr');
        if (lladdrIndex !== -1 && lladdrIndex + 1 < parts.length) {
          mac = parts[lladdrIndex + 1];
        } else if (parts.length >= 4 && parts[3].includes(':')) {
          mac = parts[3];
        }

        if (mac && mac !== '(incomplete)' && mac.includes(':') && mac.match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
          const upperMac = mac.toUpperCase();
          const existing = devicesMap.get(upperMac);
          
          // Prioritize IPv4 addresses for display
          if (!existing || (existing.ip?.includes(':') && !ip.includes(':'))) {
            devicesMap.set(upperMac, { mac: upperMac, ip });
          }
        }
      }
    }

    // Get DHCP leases for hostnames and expiry
    const leasesResult = await this.ssh.exec('cat /tmp/dhcp.leases 2>/dev/null');
    const leaseData = new Map<string, { hostname?: string; expiry: number }>();

    if (leasesResult.exitCode === 0) {
      for (const line of leasesResult.stdout.split('\n')) {
        if (!line.trim()) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const expiryTime = parseInt(parts[0], 10);
          const mac = parts[1].toUpperCase();
          const hostname = parts[3] !== '*' ? parts[3] : undefined;

          leaseData.set(mac, { hostname, expiry: expiryTime });
        }
      }
    }

    // Merge everything. Use leases as the primary source for "known" devices
    // even if they are not currently in the ARP cache.
    const allMacs = new Set([...devicesMap.keys(), ...leaseData.keys()]);
    
    return Array.from(allMacs).map(mac => {
      const live = devicesMap.get(mac);
      const lease = leaseData.get(mac);
      return {
        mac,
        ip: live?.ip,
        hostname: lease?.hostname,
        expiry: lease?.expiry
      };
    });
  }

  async tailLogs(lines: number = 50): Promise<string> {
    const result = await this.ssh.exec(`tail -n ${lines} /etc/openfam/logs/fam.log 2>/dev/null || echo "No logs yet"`);
    return result.stdout;
  }

  async getAgentStatus(): Promise<string> {
    const result = await this.ssh.exec(
      `if [ -f /etc/openfam/last-command.txt ]; then cat /etc/openfam/last-command.txt; else echo "No command executed yet"; fi`
    );
    return result.stdout;
  }
}
