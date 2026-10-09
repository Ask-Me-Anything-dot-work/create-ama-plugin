import { expect } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScaffoldConfig } from '../../src/scaffold/config';

export const TEMPLATE_DIR = join(import.meta.dir, '../../template');

export const HOOK_TIMEOUT_MS = 120_000;
export const INSTALL_TIMEOUT_MS = 300_000;
export const SELF_TEST_SPAWN_TIMEOUT_MS = 180_000;
export const PACK_SPAWN_TIMEOUT_MS = 60_000;
export const REGISTRY_PROBE_TIMEOUT_MS = 30_000;
export const PREPARE_SPAWN_TIMEOUT_MS = 10_000;
export const SELF_TEST_TIMEOUT_MS = 600_000;
export const PACK_TEST_TIMEOUT_MS = 120_000;

export function makeConfig(overrides: Partial<ScaffoldConfig> = {}): ScaffoldConfig {
  return {
    pluginId: 'test-plugin',
    provides: 'generic',
    consolePanel: false,
    migrations: false,
    ...overrides,
  };
}

export async function listFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else result.push(full.replace(dir + '/', ''));
    }
  }
  return result.sort();
}

export function spawnOk(cmd: string[], cwd: string, timeoutMs: number): void {
  const result = Bun.spawnSync(cmd, {
    cwd,
    timeout: timeoutMs,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  const detail =
    `cmd=${cmd.join(' ')} cwd=${cwd} timeoutMs=${timeoutMs} ` +
    `exitCode=${String(result.exitCode)} signalCode=${String(result.signalCode)} ` +
    `exitedDueToTimeout=${String(result.exitedDueToTimeout)}`;
  if (result.exitCode !== 0) {
    console.error(`${detail}:\n${result.stderr.toString()}`);
  }
  expect(result.exitCode, detail).toBe(0);
}
