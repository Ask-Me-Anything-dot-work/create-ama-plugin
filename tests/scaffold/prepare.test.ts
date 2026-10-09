import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

function runPrepare(prepare: string, path: string): number {
  return Bun.spawnSync(['/bin/sh', '-c', prepare], {
    env: { PATH: path },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).exitCode;
}

describe('template prepare script', () => {
  let tmpDir: string;
  let prepare: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'prepare-'));
    const out = join(tmpDir, 'project');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    prepare = pkg.scripts.prepare;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('prepare does not blanket-swallow failures', () => {
    expect(prepare).not.toContain('|| true');
  });

  test('exits 0 when husky succeeds', async () => {
    const bin = join(tmpDir, 'bin-ok');
    await mkdir(bin, { recursive: true });
    const stub = join(bin, 'husky');
    await writeFile(stub, '#!/bin/sh\nexit 0\n');
    await chmod(stub, 0o755);
    expect(runPrepare(prepare, bin)).toBe(0);
  });

  test('propagates non-zero when husky fails', async () => {
    const bin = join(tmpDir, 'bin-fail');
    await mkdir(bin, { recursive: true });
    const stub = join(bin, 'husky');
    await writeFile(stub, '#!/bin/sh\nexit 3\n');
    await chmod(stub, 0o755);
    expect(runPrepare(prepare, bin)).not.toBe(0);
  });

  test('tolerates missing husky binary (exit 127)', async () => {
    const bin = join(tmpDir, 'bin-empty');
    await mkdir(bin, { recursive: true });
    expect(runPrepare(prepare, bin)).toBe(0);
  });
});
