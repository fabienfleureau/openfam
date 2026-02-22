import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { RouterService } from '../../services/router-service.js';

interface Props {
  router: RouterService;
}

export const LogViewer: React.FC<Props> = ({ router }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const rawLogs = await router.tailLogs(20);
        setLogs(rawLogs);
      } catch (err) {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <Box gap={1}>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text>Fetching router logs...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Text bold color="white">ROUTER ACTIVITY LOGS (Auto-refreshing)</Text>
      <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray" flexGrow={1}>
        <Text color="gray" wrap="end">
          {logs || 'No logs found yet.'}
        </Text>
      </Box>
    </Box>
  );
};
