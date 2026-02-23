import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { RouterService } from '../../services/router-service.js';
import type { Config } from '../../types/config.js';

interface Props {
  router: RouterService;
}

const SimpleSpinner = () => {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  useEffect(() => {
    const timer = setInterval(() => setFrame((prev) => (prev + 1) % frames.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <Text color="cyan">{frames[frame]}</Text>;
};

export const ProfileManager: React.FC<Props> = ({ router }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const remoteConfig = await router.downloadConfig();
        setConfig(remoteConfig);
      } catch (err) { } finally { setLoading(false); }
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <Box gap={1} height="100%" alignItems="center" justifyContent="center">
        <SimpleSpinner />
        <Text color="gray"> RETRIEVING PROFILE CONFIGURATIONS...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white" inverse> ACCESS CONTROL PROFILES </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {config?.profiles.map((p, i) => (
          <Box key={p.name} flexDirection="column" marginBottom={1} paddingX={2} paddingY={1} borderStyle="round" borderColor="blue">
            <Box justifyContent="space-between">
              <Box gap={2}>
                <Text bold color="white">{p.name.toUpperCase()}</Text>
                <Text dimColor>│</Text>
                <Text color="gray">Policy: <Text color="cyan">{p.default_nextdns}</Text></Text>
              </Box>
              <Text color="gray">{p.macs.length} Devices</Text>
            </Box>
            
            <Box marginTop={1} gap={4}>
              <Text dimColor>Schedules: <Text color="white">{p.schedule.length}</Text></Text>
              <Box flexDirection="row" flexGrow={1}>
                <Text dimColor>Hardware: </Text>
                <Text color="gray" wrap="truncate-end">
                  {p.macs.map(m => m.name).join(', ') || 'None assigned'}
                </Text>
              </Box>
            </Box>
          </Box>
        ))}
        
        {(!config?.profiles || config.profiles.length === 0) && (
          <Box padding={2} borderStyle="single" borderColor="yellow">
            <Text color="yellow">No family profiles have been configured yet.</Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Use the web dashboard or CLI commands to add/edit profiles.</Text>
      </Box>
    </Box>
  );
};
