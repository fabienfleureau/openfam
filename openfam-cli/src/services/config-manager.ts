import type { Config } from '../types/config.js';
import { isValidMacAddress, isValidDay, isValidTime } from '../types/config.js';

export class ConfigManager {
  static parseConfig(jsonString: string): Config {
    try {
      return JSON.parse(jsonString) as Config;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static serializeConfig(config: Config): string {
    return JSON.stringify(config, null, 2);
  }

  static validateConfig(config: Config): void {
    if (!config.general?.timezone) {
      throw new Error('Missing general.timezone');
    }
    if (!config.general?.nextdns_default_profile) {
      throw new Error('Missing general.nextdns_default_profile');
    }

    const defaultProfile = config.general.nextdns_default_profile;
    if (!config.nextdns?.profiles?.[defaultProfile]) {
      throw new Error(`Default NextDNS profile '${defaultProfile}' not defined in nextdns.profiles. Run: openfam nextdns add <id> <name>`);
    }

    const profileIds = new Set(Object.keys(config.nextdns?.profiles || {}));

    for (const profile of config.profiles || []) {
      if (!profileIds.has(profile.default_nextdns)) {
        throw new Error(`NextDNS profile '${profile.default_nextdns}' (used by profile ${profile.name}) not defined. Run: openfam nextdns add <id> <name>`);
      }

      for (const mac of profile.macs || []) {
        if (!isValidMacAddress(mac.address)) {
          throw new Error(`Invalid MAC address: ${mac.address} (must be XX:XX:XX:XX:XX:XX)`);
        }
      }

      for (const schedule of profile.schedule || []) {
        for (const day of schedule.days) {
          if (!isValidDay(day)) {
            throw new Error(`Invalid day: ${day}`);
          }
        }
        if (!isValidTime(schedule.time_start)) {
          throw new Error(`Invalid time_start: ${schedule.time_start}`);
        }
        if (!isValidTime(schedule.time_end)) {
          throw new Error(`Invalid time_end: ${schedule.time_end}`);
        }
        if (!profileIds.has(schedule.nextdns)) {
          throw new Error(`NextDNS profile '${schedule.nextdns}' not defined`);
        }
      }
    }
  }
}
