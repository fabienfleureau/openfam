import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SSHClient } from '../ssh/client.js';
import { loadConfig } from '../config.js';

interface Device {
  mac: string;
  ip: string;
  hostname?: string;
  interface: string;
  connected: boolean;
}

export function createDevicesCommand(): Command {
  const cmd = new Command('devices');
  cmd.description('Device management commands');

  const listCmd = new Command('list')
    .description('List all connected devices on the network')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Connecting to router...').start();

      try {
        const config = loadConfig();
        const client = new SSHClient(config);

        await client.connect();
        spinner.text = 'Fetching connected devices...';

        // Get current timestamp for filtering active leases
        const timeResult = await client.exec('date +%s');
        const currentTime = parseInt(timeResult.stdout.trim(), 10);

        // Get ARP table for connected devices
        const arpResult = await client.exec('cat /proc/net/arp');

        if (arpResult.exitCode !== 0) {
          spinner.fail(chalk.red('Failed to fetch ARP table'));
          client.disconnect();
          process.exit(1);
        }

        // Parse ARP table
        const devices = parseArpTable(arpResult.stdout);

        // Get DHCP leases for hostnames (only active leases)
        const leasesResult = await client.exec('cat /tmp/dhcp.leases');
        const hostnameMap = parseDhcpLeases(leasesResult.stdout, currentTime);

        // Merge hostname info (only for devices with active leases)
        const devicesWithNames = devices.map((device) => ({
          ...device,
          hostname: hostnameMap.get(device.mac) || hostnameMap.get(device.ip),
        }));

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(devicesWithNames, null, 2));
        } else {
          displayDevices(devicesWithNames, config.routerIp);
        }

        client.disconnect();
        process.exit(0);
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch devices'));
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  cmd.addCommand(listCmd);
  return cmd;
}

function parseArpTable(output: string): Device[] {
  const lines = output.split('\n');
  const devices: Device[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // ARP table format: IP address HW type Flags HW address Mask Device
    const parts = line.split(/\s+/);
    if (parts.length >= 6) {
      const ip = parts[0];
      const hwType = parts[1];
      const flags = parts[2];
      const mac = parts[3];
      const mask = parts[4];
      const iface = parts[5];

      // Skip incomplete entries (invalid MACs)
      if (mac === '00:00:00:00:00:00' || mac.toLowerCase() === 'ff:ff:ff:ff:ff:ff') {
        continue;
      }

      // Parse ARP flags to determine connection status
      // 0x0 = incomplete (not reachable), 0x2 = complete (reachable)
      const flagValue = parseInt(flags, 16);
      const isConnected = flagValue === 0x2;

      devices.push({
        mac: mac.toUpperCase(),
        ip,
        interface: iface,
        connected: isConnected,
      });
    }
  }

  return devices;
}

function parseDhcpLeases(output: string, currentTime: number): Map<string, string> {
  const leases = new Map<string, string>();
  const lines = output.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    // DHCP leases format: timestamp mac ip hostname clientid
    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      const expiryTime = parseInt(parts[0], 10);
      const mac = parts[1].toUpperCase();
      const ip = parts[2];
      const hostname = parts[3] !== '*' ? parts[3] : undefined;

      // Only include active leases (expiry time is in the future)
      if (expiryTime > currentTime && hostname) {
        leases.set(mac, hostname);
        leases.set(ip, hostname);
      }
    }
  }

  return leases;
}

function displayDevices(devices: Device[], routerIp: string): void {
  // Split into connected and offline
  const connected = devices.filter(d => d.connected);
  const offline = devices.filter(d => !d.connected);

  // Display connected devices
  console.log(chalk.dim('─'.repeat(70)));
  console.log(chalk.green.bold(`Connected (${connected.length})`));
  console.log(chalk.dim('─'.repeat(70)));

  if (connected.length === 0) {
    console.log(chalk.yellow('  No connected devices'));
  } else {
    const sorted = [...connected].sort((a, b) => a.ip.localeCompare(b.ip));
    for (const device of sorted) {
      const isRouter = device.ip === routerIp;
      const routerLabel = isRouter ? chalk.dim(' (router)') : '';
      const statusIcon = chalk.green('●');

      console.log(
        `  ${statusIcon} ` +
        `${chalk.cyan(device.ip.padEnd(15))} ` +
        `${chalk.magenta(device.mac.padEnd(17))} ` +
        `${chalk.white((device.hostname || 'Unknown').padEnd(20))} ` +
        `${chalk.dim(device.interface)}${routerLabel}`
      );
    }
  }

  // Display offline devices
  if (offline.length > 0) {
    console.log('');
    console.log(chalk.dim('─'.repeat(70)));
    console.log(chalk.red.bold(`Offline (${offline.length})`));
    console.log(chalk.dim('─'.repeat(70)));

    const sorted = [...offline].sort((a, b) => a.ip.localeCompare(b.ip));
    for (const device of sorted) {
      const statusIcon = chalk.gray('○');
      const dimmed = (s: string) => chalk.dim(s);

      console.log(
        `  ${statusIcon} ` +
        `${dimmed(device.ip.padEnd(15))} ` +
        `${dimmed(device.mac.padEnd(17))} ` +
        `${dimmed((device.hostname || 'Unknown').padEnd(20))} ` +
        `${dimmed(device.interface)}`
      );
    }
  }

  console.log(chalk.dim('─'.repeat(70)));
  console.log(
    chalk.dim(`Total: ${chalk.bold(devices.length.toString())} device${devices.length !== 1 ? 's' : ''}  |  `) +
    chalk.green(`${connected.length} connected`) +
    chalk.dim('  |  ') +
    chalk.red(`${offline.length} offline`)
  );
  console.log(chalk.dim('─'.repeat(70)));
}
