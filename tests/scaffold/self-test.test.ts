import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir, readFile, stat } from 'node:fs/promises';
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

function spawnOk(cmd: string[], cwd: string): void {
  const result = Bun.spawnSync(cmd, { cwd, stdio: ['inherit', 'pipe', 'pipe'] });
  expect(result.exitCode).toBe(0);
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
    if (!(await isPackageAvailable())) {
      console.log('Skipping self-test: @ama-work/plugin-contract not published to npm');
      return;
    }

    const out = join(tmpDir, 'generated');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    spawnOk(['bun', 'install'], out);
    spawnOk(['bun', 'test'], out);
  }, 30000);

  test('generated project builds dist/index.js and main points to it', async () => {
    if (!(await isPackageAvailable())) {
      console.log('Skipping build self-test: @ama-work/plugin-contract not published to npm');
      return;
    }

    const out = join(tmpDir, 'build-test');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    spawnOk(['bun', 'install'], out);
    spawnOk(['bun', 'run', 'build'], out);

    const fileStat = await stat(join(out, 'dist/index.js'));
    expect(fileStat.isFile()).toBe(true);

    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.main).toBe('dist/index.js');
  }, 30000);
});
