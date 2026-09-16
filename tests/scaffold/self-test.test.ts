import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generate } from '../../src/scaffold/generator';
import type { ScaffoldConfig } from '../../src/scaffold/config';

const TEMPLATE_DIR = join(import.meta.dir, '../../template');

function makeConfig(overrides: Partial<ScaffoldConfig> = {}): ScaffoldConfig {
  return {
    pluginId: 'test-plugin',
    provides: 'generic',
    consolePanel: false,
    migrations: false,
    ...overrides,
  };
}

async function isPackageAvailable(): Promise<boolean> {
  try {
    const result = Bun.spawnSync(['npm', 'view', '@ama-work/plugin-contract', 'version']);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

describe('self-test gate', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `self-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('generated project passes bun install and bun test', async () => {
    const packageAvailable = await isPackageAvailable();
    if (!packageAvailable) {
      console.log('Skipping self-test: @ama-work/plugin-contract not published to npm');
      return;
    }

    const out = join(tmpDir, 'generated');
    await generate(makeConfig(), out, TEMPLATE_DIR);

    const installResult = Bun.spawnSync(['bun', 'install'], {
      cwd: out,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    expect(installResult.exitCode).toBe(0);

    const testResult = Bun.spawnSync(['bun', 'test'], {
      cwd: out,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    expect(testResult.exitCode).toBe(0);
  }, 30000);
});
