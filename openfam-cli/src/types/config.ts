export interface GeneralConfig {
  timezone: string;
  nextdns_default_profile: string;
}

export interface NextDNSProfile {
  id: string;
  name: string;
  link: string;
}

export interface NextDNSConfig {
  profiles: Record<string, NextDNSProfile>;
}

export interface MacEntry {
  address: string;
  name: string;
}

export interface ScheduleEntry {
  days: string[];
  time_start: string;
  time_end: string;
  nextdns: string;
}

export interface Profile {
  name: string;
  default_nextdns: string;
  macs: MacEntry[];
  schedule: ScheduleEntry[];
}

export interface Config {
  general: GeneralConfig;
  nextdns: NextDNSConfig;
  profiles: Profile[];
}

// MAC address validation: XX:XX:XX:XX:XX:XX format
export function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
  return macRegex.test(mac);
}

export function isValidDay(day: string): boolean {
  const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return validDays.includes(day);
}

export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}
