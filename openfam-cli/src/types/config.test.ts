import { describe, it, expect } from '@jest/globals';
import { Config, isValidMacAddress } from './config.js';

describe('Config Types', () => {
  describe('isValidMacAddress', () => {
    it('should accept valid MAC addresses', () => {
      expect(isValidMacAddress('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(isValidMacAddress('aa:bb:cc:dd:ee:ff')).toBe(true);
      expect(isValidMacAddress('00:11:22:33:44:55')).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(isValidMacAddress('AA-BB-CC-DD-EE-FF')).toBe(false);
      expect(isValidMacAddress('AABBCCDDEEFF')).toBe(false);
      expect(isValidMacAddress('AA:BB:CC:DD:EE')).toBe(false);
      expect(isValidMacAddress('AA:BB:CC:DD:EE:FF:GG')).toBe(false);
      expect(isValidMacAddress('')).toBe(false);
    });
  });
});
