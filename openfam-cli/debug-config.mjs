import { SSHClient } from './dist/ssh/client.js';
import { loadConfig } from './dist/config.js';
import { ConfigManager } from './dist/services/config-manager.js';

async function debug() {
  const config = loadConfig();
  const ssh = new SSHClient(config);

  try {
    await ssh.connect();
    console.log('✓ Connected to router\n');

    const result = await ssh.exec('cat /etc/openfam/config.json 2>/dev/null');
    console.log('Config exists:', result.exitCode === 0);

    if (result.exitCode === 0) {
      console.log('\n=== Raw TOML ===');
      console.log(result.stdout);

      try {
        const parsed = ConfigManager.parseConfig(result.stdout);
        console.log('\n=== Parsed ===');
        console.log('Timezone:', parsed.general?.timezone);
        console.log('Default profile:', parsed.general?.nextdns_default_profile);
        console.log('NextDNS profiles:', Object.keys(parsed.nextdns?.profiles || {}));
        console.log('User profiles count:', parsed.profiles?.length || 0);

        if (parsed.profiles && parsed.profiles.length > 0) {
          console.log('\nUser profiles:');
          parsed.profiles.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name} (NextDNS: ${p.default_nextdns})`);
          });
        }
      } catch (e) {
        console.log('\nParse error:', e);
      }
    } else {
      console.log('Error reading config:', result.stderr);
    }

    ssh.disconnect();
  } catch (e) {
    console.log('Error:', e);
  }
}

debug();
