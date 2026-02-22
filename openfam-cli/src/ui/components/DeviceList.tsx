import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { RouterService } from '../../services/router-service.js';

interface Props {
  router: RouterService;
}

interface Device {
  mac: string;
  ip?: string;
  hostname?: string;
  expiry?: number;
}

export const DeviceList: React.FC<Props> = ({ router }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    async function fetchData() {
      try {
        const discovered = await router.scanDevices();
        setDevices(discovered);
      } catch (err) {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <Box gap={1}>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text>Scanning network devices...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="white">DEVICE INVENTORY</Text>
      <Box marginTop={1} flexDirection="column">
        {/* Header */}
        <Box borderStyle="single" borderColor="gray" borderTop={false} borderLeft={false} borderRight={false}>
          <Box width={20}><Text bold>MAC ADDRESS</Text></Box>
          <Box width={25}><Text bold>HOSTNAME</Text></Box>
          <Box width={18}><Text bold>IP ADDRESS</Text></Box>
          <Box><Text bold>STATUS</Text></Box>
        </Box>

        {/* Rows */}
        {devices.map((d, i) => {
          const isOnline = d.expiry && d.expiry > now;
          return (
            <Box key={d.mac} marginTop={i === 0 ? 1 : 0}>
              <Box width={20}><Text color="cyan">{d.mac}</Text></Box>
              <Box width={25}><Text color="white" wrap="end">{d.hostname || 'unknown'}</Text></Box>
              <Box width={18}><Text color="gray">{d.ip || '—'}</Text></Box>
              <Box>
                <Text color={isOnline ? 'green' : 'gray'}>
                  {isOnline ? '● ONLINE' : '○ OFFLINE'}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
