import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInputImport from 'ink-select-input';
import { SSHClient } from '../ssh/client.js';
import { RouterService } from '../services/router-service.js';
import { Dashboard } from './components/Dashboard.js';
import { DeviceList } from './components/DeviceList.js';
import { ProfileManager } from './components/ProfileManager.js';
import { LogViewer } from './components/LogViewer.js';

// Handle CJS/ESM default export mess
const SelectInput = (SelectInputImport as any).default || SelectInputImport;

interface Props {
  ssh: SSHClient;
  router: RouterService;
}

type View = 'dashboard' | 'profiles' | 'devices' | 'logs' | 'exit';

export const App: React.FC<Props> = ({ ssh, router }) => {
  const { exit } = useApp();
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  const menuItems = [
    { label: ' 📊  Dashboard ', value: 'dashboard' as const },
    { label: ' 👥  Profiles  ', value: 'profiles' as const },
    { label: ' 📱  Devices   ', value: 'devices' as const },
    { label: ' 📝  Logs      ', value: 'logs' as const },
    { label: ' 🚪  Exit      ', value: 'exit' as const },
  ];

  const handleSelect = (item: { value: View }) => {
    if (item.value === 'exit') exit();
    setActiveView(item.value);
  };

  useInput((input) => {
    if (input === 'q') exit();
    if (input === 'd') setActiveView('dashboard');
    if (input === 'p') setActiveView('profiles');
    if (input === 'v') setActiveView('devices');
    if (input === 'l') setActiveView('logs');
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Top Bar - No border to save vertical space if terminal is small */}
      <Box 
        paddingX={2} 
        justifyContent="space-between"
        backgroundColor="cyan"
      >
        <Box gap={1}>
          <Text bold color="black">🛡️  OpenFAM</Text>
          <Text color="black">│ Obsidian Dashboard</Text>
        </Box>
        <Box gap={2}>
          <Text color="black" bold>● CONNECTED</Text>
        </Box>
      </Box>

      <Box flexGrow={1} marginTop={1}>
        {/* Navigation Sidebar */}
        <Box 
          flexDirection="column" 
          width={24} 
          borderStyle="round" 
          borderColor="gray" 
          paddingX={1}
        >
          <Box marginBottom={1} paddingX={1}>
            <Text bold color="white">MENU</Text>
          </Box>
          <SelectInput 
            items={menuItems} 
            onSelect={handleSelect}
            indicatorComponent={({ isSelected }) => (
              <Text color="cyan">{isSelected ? ' › ' : '   '}</Text>
            )}
          />
          
          <Box marginTop="auto" flexDirection="column" paddingX={1}>
            <Text dimColor>Shortcuts:</Text>
            <Text dimColor>[d] Dashboard</Text>
            <Text dimColor>[p] Profiles</Text>
            <Text dimColor>[v] Devices</Text>
            <Text dimColor>[l] Logs</Text>
            <Text dimColor>[q] Quit</Text>
          </Box>
        </Box>

        {/* Dynamic Content Area */}
        <Box 
          flexGrow={1} 
          borderStyle="round" 
          borderColor="white" 
          paddingX={2}
        >
          {activeView === 'dashboard' && <Dashboard router={router} />}
          {activeView === 'devices' && <DeviceList router={router} />}
          {activeView === 'profiles' && <ProfileManager router={router} />}
          {activeView === 'logs' && <LogViewer router={router} />}
        </Box>
      </Box>

      {/* Footer / Status Bar */}
      <Box paddingX={1}>
        <Text dimColor>Use Arrow Keys & Enter to navigate</Text>
      </Box>
    </Box>
  );
};
