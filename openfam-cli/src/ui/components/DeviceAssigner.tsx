import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInputImport from 'ink-select-input';
import TextInputImport from 'ink-text-input';
import { RouterService } from '../../services/router-service.js';
import { ConfigManager } from '../../services/config-manager.js';
import type { Config } from '../../types/config.js';

const SelectInput = (SelectInputImport as any).default || SelectInputImport;
const TextInput = (TextInputImport as any).default || TextInputImport;

interface Props {
  router: RouterService;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'select-device' | 'select-profile' | 'enter-name' | 'saving' | 'success' | 'error';

export const DeviceAssigner: React.FC<Props> = ({ router, onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('select-device');
  const [config, setConfig] = useState<Config | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMac, setSelectedMac] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [remoteConfig, discovered] = await Promise.all([
          router.downloadConfig(),
          router.scanDevices()
        ]);
        setConfig(remoteConfig);
        setDevices(discovered);
      } catch (err) {
        setError('Failed to load data from router');
        setStep('error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleDeviceSelect = (item: { value: string, label: string }) => {
    setSelectedMac(item.value);
    
    // Try to find a default name from hostname
    const device = devices.find(d => d.mac === item.value);
    if (device && device.hostname) {
      setDeviceName(device.hostname);
    } else {
      setDeviceName(`Device ${item.value.slice(-5)}`);
    }
    
    setStep('select-profile');
  };

  const handleProfileSelect = (item: { value: string }) => {
    setSelectedProfile(item.value);
    setStep('enter-name');
  };

  const handleNameSubmit = async () => {
    if (!deviceName.trim()) return;
    setStep('saving');
    
    try {
      const remoteConfig = await router.downloadConfig();
      if (!remoteConfig) throw new Error('Config missing');

      const profile = remoteConfig.profiles.find(p => p.name === selectedProfile);
      if (!profile) throw new Error('Profile missing');

      // Check if already exists
      const alreadyAssigned = remoteConfig.profiles.some(p => p.macs.some(m => m.address === selectedMac));
      if (alreadyAssigned) throw new Error('Device already assigned to a profile');

      profile.macs.push({ address: selectedMac, name: deviceName.trim() });
      
      ConfigManager.validateConfig(remoteConfig);
      await router.uploadConfig(remoteConfig);
      
      setStep('success');
      setTimeout(onComplete, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('error');
    }
  };

  useInput((input, key) => {
    if (key.escape) onCancel();
  });

  if (loading) {
    return <Text color="gray"> Loading assignment tools...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white" inverse> ASSOCIATE DEVICE TO PROFILE </Text>
        <Box marginLeft={2}>
          <Text dimColor>Step: {step.toUpperCase().replace('-', ' ')}</Text>
        </Box>
      </Box>

      {step === 'select-device' && (
        <Box flexDirection="column">
          <Text color="cyan" bold>1. Select a device from the network:</Text>
          <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} width={60}>
            <SelectInput 
              items={devices
                .sort((a, b) => (a.hostname || '').localeCompare(b.hostname || ''))
                .map(d => ({
                  label: `${d.mac.padEnd(18)} │ ${d.hostname || 'unknown'}`,
                  value: d.mac
                }))
              } 
              onSelect={handleDeviceSelect} 
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Tip: Use arrow keys to find the device you want to protect.</Text>
          </Box>
        </Box>
      )}

      {step === 'select-profile' && (
        <Box flexDirection="column">
          <Text color="cyan" bold>2. Assign &quot;{selectedMac}&quot; to which profile?</Text>
          <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} width={40}>
            <SelectInput 
              items={config?.profiles.map(p => ({
                label: p.name,
                value: p.name
              })) || []} 
              onSelect={handleProfileSelect} 
            />
          </Box>
        </Box>
      )}

      {step === 'enter-name' && (
        <Box flexDirection="column">
          <Text color="cyan" bold>3. Enter a recognizable name for this device:</Text>
          <Box marginTop={1} borderStyle="single" borderColor="blue" paddingX={1} width={40}>
            <TextInput 
              value={deviceName} 
              onChange={setDeviceName} 
              onSubmit={handleNameSubmit}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Enter to confirm or ESC to cancel.</Text>
          </Box>
        </Box>
      )}

      {step === 'saving' && (
        <Box paddingY={2} alignItems="center" justifyContent="center">
          <Text color="yellow" bold animate="pulse">SAVING TO ROUTER...</Text>
        </Box>
      )}

      {step === 'success' && (
        <Box paddingY={2} borderStyle="round" borderColor="green" paddingX={4} alignSelf="center">
          <Text color="green" bold>✓ DEVICE SUCCESSFULLY ASSOCIATED</Text>
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column" padding={1} borderStyle="double" borderColor="red">
          <Text color="red" bold>ERROR: {error}</Text>
          <Box marginTop={1}>
            <Text dimColor>Press ESC to go back.</Text>
          </Box>
        </Box>
      )}

      <Box marginTop="auto" borderStyle="single" borderColor="gray" borderBottom={false} borderLeft={false} borderRight={false} paddingTop={1}>
        <Text dimColor>Press <Text bold color="white">ESC</Text> to cancel and return to dashboard.</Text>
      </Box>
    </Box>
  );
};
