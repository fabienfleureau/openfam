import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { RouterService } from '../../services/router-service.js';
import type { Config } from '../../types/config.js';

interface Props {
  router: RouterService;
}

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
        <Text>Fetching dashboard data...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="white">HOUSEHOLD SUMMARY</Text>
      <Box flexDirection="row" gap={4} marginTop={1}>
        <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1} width={30}>
          <Text bold color="blue">Network Health</Text>
          <Box marginTop={1}>
            <Text>Status: <Text color="green">Active</Text></Text>
          </Box>
          <Text>Uptime: <Text color="white">Healthy</Text></Text>
        </Box>

        <Box flexDirection="column" borderStyle="single" borderColor="magenta" paddingX={1} width={30}>
          <Text bold color="magenta">Active Profiles</Text>
          <Box marginTop={1}>
            <Text>Profiles: <Text color="white">{config?.profiles.length || 0}</Text></Text>
          </Box>
          <Text>NextDNS: <Text color="white">{Object.keys(config?.nextdns.profiles || {}).length}</Text></Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Last Agent Command:</Text>
        <Box padding={1} backgroundColor="white" paddingX={1} width="100%">
          <Text color="black" wrap="truncate-middle">{routerStatus || 'None'}</Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>System Info:</Text>
        <Text color="gray">Timezone: {config?.general.timezone}</Text>
        <Text color="gray">Default Profile: {config?.general.nextdns_default_profile}</Text>
      </Box>
    </Box>
  );
};
