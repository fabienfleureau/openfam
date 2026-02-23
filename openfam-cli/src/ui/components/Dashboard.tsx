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

export const Dashboard: React.FC<Props> = ({ router }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [routerStatus, setRouterStatus] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [remoteConfig, status] = await Promise.all([
          router.downloadConfig(),
          router.getAgentStatus()
        ]);
        setConfig(remoteConfig);
        setRouterStatus(status);
      } catch (err) { } finally { setLoading(false); }
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <Box gap={1} height="100%" alignItems="center" justifyContent="center">
        <SimpleSpinner />
        <Text color="gray"> SYNCHRONIZING WITH ROUTER...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box marginBottom={1}>
        <Text bold color="white" inverse> HOUSEHOLD OVERVIEW </Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        {/* Core Stats Bento */}
        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="blue" paddingX={1}>
          <Text bold color="blue">Network Status</Text>
          <Box marginTop={1} flexDirection="column">
            <Box justifyContent="space-between">
              <Text color="gray">System state:</Text>
              <Text color="green" bold>HEALTHY</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Uptime:</Text>
              <Text color="white">14d 2h</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Active devices:</Text>
              <Text color="cyan" bold>12</Text>
            </Box>
          </Box>
        </Box>

        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="magenta" paddingX={1}>
          <Text bold color="magenta">Filtering Stats</Text>
          <Box marginTop={1} flexDirection="column">
            <Box justifyContent="space-between">
              <Text color="gray">Total profiles:</Text>
              <Text color="white" bold>{config?.profiles.length || 0}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">DNS profiles:</Text>
              <Text color="white">{Object.keys(config?.nextdns.profiles || {}).length}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Ads blocked today:</Text>
              <Text color="green">1,452</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="gray">ACTIVE AGENT STATE</Text>
        <Box 
          marginTop={1} 
          paddingX={2} 
          paddingY={1} 
          backgroundColor="gray" 
          width="100%"
        >
          <Text color="black" bold italic wrap="truncate-middle">
            {routerStatus || 'Standby - Waiting for first poll cycle'}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
        <Box flexDirection="column">
          <Text dimColor>ENVIRONMENT</Text>
          <Box gap={4} marginTop={1}>
            <Text color="gray">Zone: <Text color="white">{config?.general.timezone}</Text></Text>
            <Text color="gray">Default: <Text color="cyan">{config?.general.nextdns_default_profile}</Text></Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
