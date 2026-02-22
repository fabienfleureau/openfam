import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { RouterService } from '../../services/router-service.js';
import type { Config } from '../../types/config.js';

interface Props {
  router: RouterService;
}

export const ProfileManager: React.FC<Props> = ({ router }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const remoteConfig = await router.downloadConfig();
        setConfig(remoteConfig);
      } catch (err) {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <Box gap={1}>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text>Loading profiles...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="white">FAMILY PROFILES</Text>
      <Box marginTop={1} flexDirection="column">
        {config?.profiles.map((p, i) => (
          <Box key={p.name} flexDirection="column" marginTop={i === 0 ? 0 : 1} paddingY={1} borderStyle="round" borderColor="blue" paddingX={1}>
            <Box justifyContent="space-between">
              <Text bold color="white">{p.name.toUpperCase()}</Text>
              <Text color="gray">Default: <Text color="blue">{p.default_nextdns}</Text></Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Devices: {p.macs.length}</Text>
              <Box marginLeft={4}>
                <Text dimColor>Schedules: {p.schedule.length}</Text>
              </Box>
            </Box>
            {p.macs.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                {p.macs.map(m => (
                  <Text key={m.address} color="gray">  - {m.name} ({m.address})</Text>
                ))}
              </Box>
            )}
          </Box>
        ))}
        {(!config?.profiles || config.profiles.length === 0) && (
          <Text color="yellow">No profiles configured.</Text>
        )}
      </Box>
    </Box>
  );
};
