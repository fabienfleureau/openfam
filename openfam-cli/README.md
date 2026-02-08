# openfam-cli

Open-F.A.M. CLI - Installer and management tool for OpenWrt parental control.

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration

Create a `.env` file in the project root (or copy `.env.example`):

\`\`\`bash
cp .env.example .env
\`\`\`

Then edit `.env` with your router details:

\`\`\`env
OPENWRT_ROUTER_IP=192.168.10.1
OPENWRT_USERNAME=root
OPENWRT_PASSWORD=your_password
\`\`\`

Or use SSH key authentication:

\`\`\`env
OPENWRT_ROUTER_IP=192.168.10.1
OPENWRT_USERNAME=root
OPENWRT_SSH_KEY_PATH=~/.ssh/id_rsa
\`\`\`

## Usage

### Check router connection

\`\`\`bash
npm run start auth check
\`\`\`

Or after linking globally:

\`\`\`bash
openfam auth check
\`\`\`

### List connected devices

\`\`\`bash
npm run start devices list
\`\`\`

Output as JSON:

\`\`\`bash
npm run start devices list --json
\`\`\`

## Development

\`\`\`bash
# Watch mode for TypeScript
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
\`\`\`

## Commands

- `auth check` - Verify SSH connectivity to the router
- `devices list` - List all connected devices on the network
