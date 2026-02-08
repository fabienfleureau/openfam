import { NodeSSH } from 'node-ssh';
import type { Config } from '../config.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface SSHResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SSHClient {
  private ssh: NodeSSH;
  private config: Config;
  private connected: boolean = false;

  constructor(config: Config) {
    this.ssh = new NodeSSH();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // SSH key authentication only - no password auth for security
    const keyPath = this.config.sshKeyPath;
    if (!keyPath) {
      throw new Error(
        'SSH key path not configured. Please set OPENWRT_SSH_KEY_PATH in .env'
      );
    }

    // Validate SSH key exists
    const expandedPath = this.expandPath(keyPath);
    if (!fs.existsSync(expandedPath)) {
      throw new Error(`SSH key not found: ${expandedPath}`);
    }

    // Check file permissions (should be 0600 or stricter)
    const stats = fs.statSync(expandedPath);
    const mode = stats.mode & 0o777;
    if (mode !== 0o600 && mode !== 0o400) {
      console.warn(`\n⚠️  Warning: SSH key has loose permissions (${mode.toString(8)}). Recommended: 600`);
    }

    try {
      const connectionConfig = {
        host: this.config.routerIp,
        port: this.config.routerPort,
        username: this.config.username,
        privateKeyPath: expandedPath,
        readyTimeout: 30000,
        // Security: strict host key checking to prevent MITM attacks
        strictHostKeyChecking: 'yes',
        // Use system known_hosts file
        knownHostsPath: path.join(os.homedir(), '.ssh', 'known_hosts'),
      };

      await this.ssh.connect(connectionConfig);
      this.connected = true;
    } catch (error) {
      if (error instanceof Error) {
        // Provide helpful error for host key verification failures
        if (error.message.includes('HOST_KEY')) {
          throw new Error(
            `SSH host key verification failed. If this is your first connection, run:\n` +
            `  ssh-keyscan ${this.config.routerIp} >> ~/.ssh/known_hosts`
          );
        }
      }
      throw new Error(
        `Failed to connect to router at ${this.config.routerIp}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async exec(command: string): Promise<SSHResult> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.ssh.execCommand(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.code || 0,
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: -1,
      };
    }
  }

  disconnect(): void {
    if (this.connected) {
      this.ssh.dispose();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private expandPath(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    if (filePath === '~') {
      return os.homedir();
    }
    return filePath;
  }
}
