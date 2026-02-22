# OpenFAM CLI

Installer and management tool for OpenFAM parental control on OpenWrt routers.

## Installation

```bash
cd openfam-cli
npm install && npm run build
npm link              # Optional: makes 'openfam' available globally
```

## Configuration

Create a `.env` file in the `openfam-cli/` directory:

```env
OPENWRT_ROUTER_IP=192.168.1.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
OPENWRT_ROUTER_PORT=22
OPENWRT_USERNAME=root
```

**Important:** Add your router's SSH host key before connecting:

```bash
ssh-keyscan 192.168.1.1 >> ~/.ssh/known_hosts
```

## Usage

### Check Connectivity

```bash
openfam install --check
```

### Full Installation

```bash
openfam install
```

This will:
1. Connect to your OpenWrt router
2. Install dependencies (nextdns, jq)
3. Create /etc/fam directories
4. Prompt for NextDNS profile info
5. Upload agent scripts
6. Configure cron for 5-minute polling

### Manage Profiles

```bash
# List all profiles
openfam profiles list

# Create a new profile
openfam profiles add "Emma"

# Show profile details
openfam profiles show 1

# Delete a profile
openfam profiles remove 1
```

### Manage Devices

```bash
# Scan for connected devices
openfam devices scan

# List all configured devices
openfam devices list

# Add a device to a profile
openfam devices add 1 AA:BB:CC:DD:EE:FF --name "Phone"

# Remove a device
openfam devices remove AA:BB:CC:DD:EE:FF
```

### Manage Schedules

```bash
# Add a time-based schedule to a profile
openfam schedule add 1

# Show schedule for a profile
openfam schedule show 1

# Remove a schedule
openfam schedule remove 1 1
```

### Manage NextDNS Profiles

```bash
# List all NextDNS profiles
openfam nextdns list

# Add a new NextDNS profile
openfam nextdns add abc123 "Restricted"

# Remove a NextDNS profile
openfam nextdns remove restricted
```

### Status and Logs

```bash
# Check agent status
openfam status

# View recent logs
openfam logs

# Tail logs in real-time
openfam logs --tail

# View specific number of log lines
openfam logs -n 100
```

## Development

```bash
npm run build           # Compile TypeScript
npm run dev             # Watch mode
npm run type-check      # TypeScript validation
npm run lint            # ESLint
```

## Security Notes

- **SSH Key Authentication Only**: Passwords are not supported
- **Strict Host Key Checking**: Prevents MITM attacks
- **No Secrets in Code**: Never commit `.env` files or private keys
- **Debug Mode Warnings**: Debug mode may expose sensitive info

## Example Workflow

```bash
# 1. Check connectivity
openfam install --check

# 2. Install agent on router
openfam install

# 3. Create a profile for your child
openfam profiles add "Emma"

# 4. Scan for devices
openfam devices scan

# 5. Add device to profile
openfam devices add 1 AA:BB:CC:DD:EE:FF --name "Emma's Phone"

# 6. Add a schedule (e.g., bedtime restrictions)
openfam schedule add 1

# 7. Check status
openfam status

# 8. View logs
openfam logs
```

## Troubleshooting

### SSH Connection Issues

```bash
# Verify SSH key exists
ls -la ~/.ssh/id_ed25519

# Add router to known_hosts
ssh-keyscan 192.168.1.1 >> ~/.ssh/known_hosts

# Test SSH connection
ssh root@192.168.1.1
```

### Agent Not Running

```bash
# SSH to router
ssh root@192.168.1.1

# Check if agent exists
ls -la /etc/fam/agent.sh

# Check cron entry
crontab -l | grep fam

# View logs
tail -f /etc/fam/logs/fam.log
```

### Config Issues

```bash
# SSH to router
ssh root@192.168.1.1

# View config
cat /etc/fam/config.toml

# Test agent manually
/etc/fam/agent.sh
```

## License

MIT
