import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
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

const SimpleSpinner = () => {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  useEffect(() => {
    const timer = setInterval(() => setFrame((prev) => (prev + 1) % frames.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <Text color="cyan">{frames[frame]}</Text>;
};

export const DeviceList: React.FC<Props> = ({ router }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    async function fetchData() {
      try {
        const discovered = await router.scanDevices();
        setDevices(discovered);
      } catch (err) { } finally { setLoading(false); }
    }
    fetchData();
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <Box gap={1} height="100%" alignItems="center" justifyContent="center">
        <SimpleSpinner />
        <Text color="gray"> SCANNING NETWORK INFRASTRUCTURE...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white" inverse> DEVICE INVENTORY </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {/* Table Header */}
        <Box borderStyle="single" borderColor="gray" borderTop={false} borderLeft={false} borderRight={false} paddingBottom={1}>
          <Box width={20}><Text bold color="white">MAC ADDRESS</Text></Box>
          <Box width={25}><Text bold color="white">NAME / HOSTNAME</Text></Box>
          <Box width={18}><Text bold color="white">IP ADDRESS</Text></Box>
          <Box><Text bold color="white">STATUS</Text></Box>
        </Box>

        {/* Device Rows */}
        <Box flexDirection="column" marginTop={1}>
          {devices
            .sort((a, b) => {
              const aOnline = a.expiry && a.expiry > now;
              const bOnline = b.expiry && b.expiry > now;
              if (aOnline !== bOnline) return aOnline ? -1 : 1;
              return (a.hostname || '').localeCompare(b.hostname || '');
            })
            .map((d) => {
              const isOnline = d.expiry && d.expiry > now;
              return (
                <Box key={d.mac} paddingY={0}>
                  <Box width={20}><Text color="cyan">{d.mac}</Text></Box>
                  <Box width={25}><Text color={d.hostname ? 'white' : 'gray'} wrap="truncate-end">{d.hostname || 'unknown'}</Text></Box>
                  <Box width={18}><Text color="gray">{d.ip || '—'}</Text></Box>
                  <Box>
                    <Text bold color={isOnline ? 'green' : 'gray'}>
                      {isOnline ? '● ONLINE' : '○ OFFLINE'}
                    </Text>
                  </Box>
                </Box>
              );
            })}
        </Box>
      </Box>

      <Box marginTop={1} paddingTop={1} borderStyle="single" borderColor="gray" borderBottom={false} borderLeft={false} borderRight={false}>
        <Text dimColor>Total Devices Detected: <Text color="white" bold>{devices.length}</Text></Text>
      </Box>
    </Box>
  );
};
