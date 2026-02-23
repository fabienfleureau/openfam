import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { RouterService } from '../../services/router-service.js';

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

export const LogViewer: React.FC<Props> = ({ router }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const rawLogs = await router.tailLogs(20);
        setLogs(rawLogs);
      } catch (err) { } finally { setLoading(false); }
    }
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <Box gap={1} height="100%" alignItems="center" justifyContent="center">
        <SimpleSpinner />
        <Text color="gray"> OPENING SYSTEM LOGSTREAM...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="white" inverse> LIVE SYSTEM LOGS </Text>
        <Box gap={1}>
          <SimpleSpinner />
          <Text dimColor>POLLING ACTIVE (5s)</Text>
        </Box>
      </Box>

      <Box 
        marginTop={1} 
        paddingX={2} 
        paddingY={1} 
        borderStyle="single" 
        borderColor="gray" 
        flexDirection="column"
        flexGrow={1}
      >
        <Text color="gray">
          {logs || 'No active logs recorded. Agent is in standby.'}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press [l] to force refresh manually.</Text>
      </Box>
    </Box>
  );
};
