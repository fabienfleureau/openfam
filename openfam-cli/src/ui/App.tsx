import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { Dashboard } from './components/Dashboard.js';
import { DeviceList } from './components/DeviceList.js';
import { ProfileManager } from './components/ProfileManager.js';
import { LogViewer } from './components/LogViewer.js';

interface Props {
  ssh: SSHClient;
  router: RouterService;
}

type View = 'dashboard' | 'profiles' | 'devices' | 'logs' | 'exit';

export const App: React.FC<Props> = ({ ssh, router }) => {
  const { exit } = useApp();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connected');

  const menuItems = [
    { label: '📊 Dashboard', value: 'dashboard' as const },
    { label: '👥 Profiles ', value: 'profiles' as const },
    { label: '📱 Devices  ', value: 'devices' as const },
    { label: '📝 Logs     ', value: 'logs' as const },
    { label: '🚪 Exit     ', value: 'exit' as const },
  ];

  const handleSelect = (item: { value: View }) => {
    if (item.value === 'exit') {
      exit();
      return;
    }
    setActiveView(item.value);
  };

  useInput((input, key) => {
    if (input === 'q') exit();
    if (input === 'd') setActiveView('dashboard');
    if (input === 'p') setActiveView('profiles');
    if (input === 'v') setActiveView('devices');
    if (input === 'l') setActiveView('logs');
  });

  return (
    <Box flexDirection="column" minHeight={20}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color="cyan">🛡️ OpenFAM </Text>
          <Text color="gray">| Interactive Dashboard</Text>
        </Box>
        <Box>
          <Text color={status === 'connected' ? 'green' : 'red'}>
            ● {status.toUpperCase()}
          </Text>
        </Box>
      </Box>

      <Box flexGrow={1}>
        {/* Sidebar */}
        <Box 
          flexDirection="column" 
          width={20} 
          borderStyle="round" 
          borderColor="gray" 
          paddingX={1}
        >
          <Text bold underline>MENU</Text>
          <Box marginTop={1}>
            <SelectInput items={menuItems} onSelect={handleSelect} />
          </Box>
          <Box marginTop={2} flexDirection="column">
            <Text dimColor>Shortcuts:</Text>
            <Text dimColor>[d] Dashboard</Text>
            <Text dimColor>[p] Profiles</Text>
            <Text dimColor>[v] Devices</Text>
            <Text dimColor>[l] Logs</Text>
            <Text dimColor>[q] Quit</Text>
          </Box>
        </Box>

        {/* Main Content */}
        <Box 
          flexGrow={1} 
          borderStyle="round" 
          borderColor="white" 
          paddingX={2}
          paddingY={1}
        >
          {activeView === 'dashboard' && <Dashboard router={router} />}
          {activeView === 'devices' && <DeviceList router={router} />}
          {activeView === 'profiles' && <ProfileManager router={router} />}
          {activeView === 'logs' && <LogViewer router={router} />}
        </Box>
      </Box>

      {/* Footer */}
      <Box backgroundColor="gray" paddingX={1}>
        <Text color="black"> Use arrow keys to navigate • Press Enter to select </Text>
      </Box>
    </Box>
  );
};
