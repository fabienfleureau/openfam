import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { App } from '../ui/App.js';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { loadConfig as loadSSHConfig } from '../config.js';

export function createUICommand(): Command {
  return new Command('ui')
    .description('Open interactive TUI dashboard')
    .action(async () => {
      const config = loadSSHConfig();
      const ssh = new SSHClient(config);
      const router = new RouterService(ssh);

      try {
        await ssh.connect();
        
        const { waitUntilExit } = render(
          React.createElement(App, { ssh, router })
        );

        await waitUntilExit();
      } catch (error) {
        console.error('Failed to start TUI:', error);
        process.exit(1);
      } finally {
        ssh.disconnect();
      }
    });
}
