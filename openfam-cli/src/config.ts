import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current working directory
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export interface Config {
  routerIp: string;
  routerPort: number;
  username: string;
  sshKeyPath: string;
}

export function loadConfig(): Config {
  const routerIp = process.env.OPENWRT_ROUTER_IP || process.env.OPENFAM_ROUTER_IP || '192.168.1.1';
  const sshKeyPath = process.env.OPENWRT_SSH_KEY_PATH;

  // SSH key is required for security (no password auth)
  if (!sshKeyPath) {
    throw new Error(
      'OPENWRT_SSH_KEY_PATH is required. Add it to your .env file:\n' +
      '  OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519'
    );
  }

  // Expand ~ to home directory
  const expandedKeyPath = sshKeyPath.startsWith('~/')
    ? path.join(os.homedir(), sshKeyPath.slice(2))
    : sshKeyPath === '~'
    ? os.homedir()
    : sshKeyPath;

  return {
    routerIp,
    routerPort: parseInt(process.env.OPENWRT_ROUTER_PORT || '22', 10),
    username: process.env.OPENWRT_USERNAME || 'root',
    sshKeyPath: expandedKeyPath,
  };
}

export const config = loadConfig();
