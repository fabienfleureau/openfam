import { SSHClient } from './dist/ssh/client.js';
import { loadConfig } from './dist/config.js';

async function diagnose() {
  const config = loadConfig();
  const ssh = new SSHClient(config);

  try {
    await ssh.connect();
    console.log('✓ Connected to router\n');

    // 1. Check agent file
    console.log('=== 1. Agent File ===');
    const agentCheck = await ssh.exec('ls -la /etc/fam/agent.sh 2>/dev/null');
    if (agentCheck.exitCode === 0) {
      console.log('  ✓ Agent exists');
      console.log('  ', agentCheck.stdout.trim());
    } else {
      console.log('  ✗ Agent NOT found');
    }

    // 2. Check config file
    console.log('\n=== 2. Config File ===');
    const configCheck = await ssh.exec('ls -la /etc/fam/config.toml 2>/dev/null');
    if (configCheck.exitCode === 0) {
      console.log('  ✓ Config exists');
    } else {
      console.log('  ✗ Config NOT found');
    }

    // 3. Check lib directory
    console.log('\n=== 3. Library Scripts ===');
    const libCheck = await ssh.exec('ls -la /etc/fam/lib/ 2>/dev/null');
    if (libCheck.exitCode === 0) {
      console.log('  ✓ Lib directory exists');
      libCheck.stdout.split('\n').forEach(line => {
        if (line.includes('.sh')) console.log('   ', line.trim());
      });
    } else {
      console.log('  ✗ Lib directory NOT found');
    }

    // 4. Check cron
    console.log('\n=== 4. Cron Entry ===');
    const cronCheck = await ssh.exec('crontab -l 2>/dev/null | grep fam');
    if (cronCheck.stdout.trim()) {
      console.log('  ✓ Cron entry found:');
      console.log('   ', cronCheck.stdout.trim());
    } else {
      console.log('  ✗ NO cron entry found');
      console.log('   Run: openfam install (or setup cron manually)');
    }

    // 5. Check logs directory
    console.log('\n=== 5. Logs Directory ===');
    const logsCheck = await ssh.exec('ls -la /etc/fam/logs/ 2>/dev/null');
    if (logsCheck.exitCode === 0) {
      console.log('  ✓ Logs directory exists');
      const logCheck = await ssh.exec('cat /etc/fam/logs/fam.log 2>/dev/null | tail -5');
      if (logCheck.stdout.trim()) {
        console.log('  Recent logs:');
        console.log(logCheck.stdout);
      } else {
        console.log('  No logs yet (agent may not have run)');
      }
    } else {
      console.log('  ✗ Logs directory NOT found');
    }

    // 6. Test agent manually
    console.log('\n=== 6. Manual Agent Test ===');
    console.log('  Running agent manually...');
    const agentRun = await ssh.exec('/etc/fam/agent.sh 2>&1');
    console.log('  Exit code:', agentRun.exitCode);
    if (agentRun.stdout) console.log('  Output:', agentRun.stdout);

    // 7. Check last command
    console.log('\n=== 7. Last Command ===');
    const lastCmd = await ssh.exec('cat /etc/fam/last-command.txt 2>/dev/null');
    if (lastCmd.stdout.trim()) {
      console.log('  ', lastCmd.stdout.trim());
    } else {
      console.log('  No command executed yet');
    }

    ssh.disconnect();
    console.log('\n✓ Diagnostics complete');
  } catch (e) {
    console.log('Error:', e);
  }
}

diagnose();
