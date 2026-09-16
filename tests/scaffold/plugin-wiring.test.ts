import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { rm, readFile, mkdir } from 'node:fs/promises';
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

describe('plugin wiring', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `plugin-wiring-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('generated src/index.ts contains OrchestratorPlugin', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const index = await readFile(join(tmpDir, 'output/src/index.ts'), 'utf-8');
    expect(index).toContain('OrchestratorPlugin');
    expect(index).toContain("id: 'test-plugin'");
    expect(index).not.toContain('/health');
  });

  test('generated package.json has @ama-work/plugin-contract dep', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(tmpDir, 'output/package.json'), 'utf-8'));
    expect(pkg.dependencies['@ama-work/plugin-contract']).toBe('^1.0.0');
    expect(pkg.dependencies.hono).toBeUndefined();
  });

  test('generated tests/plugin.test.ts exists', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const testFile = await readFile(join(tmpDir, 'output/tests/plugin.test.ts'), 'utf-8');
    expect(testFile).toContain('MockBridge');
    expect(testFile).toContain('test-plugin');
  });

  test('generated .npmrc uses public npm registry', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const npmrc = await readFile(join(tmpDir, 'output/.npmrc'), 'utf-8');
    expect(npmrc).toContain('https://registry.npmjs.org');
    expect(npmrc).not.toContain('verdaccio');
  });
});
