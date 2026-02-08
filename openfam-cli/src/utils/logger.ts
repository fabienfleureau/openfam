import chalk from 'chalk';

let isDebug = false;

export function setDebug(enabled: boolean): void {
  isDebug = enabled;
}

export function debug(message: string): void {
  if (isDebug) {
    console.log(chalk.dim(`[DEBUG] ${message}`));
  }
}

export function debugObject(label: string, obj: unknown): void {
  if (isDebug) {
    console.log(chalk.dim(`[DEBUG] ${label}:`));
    console.log(chalk.dim(JSON.stringify(obj, null, 2)));
  }
}

export function isDebugEnabled(): boolean {
  return isDebug;
}
