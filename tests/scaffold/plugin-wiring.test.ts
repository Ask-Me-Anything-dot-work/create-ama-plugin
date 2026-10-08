import { expect, test, describe } from 'bun:test';
import { rm, readFile } from 'node:fs/promises';
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

async function withGenerated(
  run: (out: string) => Promise<void>,
  overrides: Partial<ScaffoldConfig> = {},
): Promise<void> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const out = join(tmpdir(), `plugin-wiring-${suffix}`);
  try {
    await generate(makeConfig(overrides), out, TEMPLATE_DIR);
    await run(out);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

describe('plugin wiring', () => {
  test('generated src/index.ts contains OrchestratorPlugin', () =>
    withGenerated(async (out) => {
      const index = await readFile(join(out, 'src/index.ts'), 'utf-8');
      expect(index).toContain('OrchestratorPlugin');
      expect(index).toContain("id: 'test-plugin'");
      expect(index).not.toContain('/health');
    }));

  test('generated src/index.ts uses named plugin export', () =>
    withGenerated(async (out) => {
      const index = await readFile(join(out, 'src/index.ts'), 'utf-8');
      expect(index).toContain('export { plugin }');
      expect(index).toContain('export default plugin');
      expect(index).not.toContain('export default {');
    }));

  test('generated package.json declares main and module entrypoints', () =>
    withGenerated(async (out) => {
      const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
      expect(pkg.main).toBe('dist/index.js');
      expect(pkg.module).toBe('dist/index.js');
    }));

  test('generated tests/contract.test.ts asserts export contract', () =>
    withGenerated(async (out) => {
      const contract = await readFile(join(out, 'tests/contract.test.ts'), 'utf-8');
      expect(contract).toContain('plugin ??');
      expect(contract).toContain('onStart');
      expect(contract).toContain('onStop');
    }));

  test('generated package.json has @ama-work/plugin-contract dep', () =>
    withGenerated(async (out) => {
      const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['@ama-work/plugin-contract']).toBe('^1.0.1');
      expect(pkg.dependencies.hono).toBeUndefined();
    }));

  test('generated tests/plugin.test.ts exists', () =>
    withGenerated(async (out) => {
      const testFile = await readFile(join(out, 'tests/plugin.test.ts'), 'utf-8');
      expect(testFile).toContain('MockBridge');
      expect(testFile).toContain('test-plugin');
    }));

  test('generated .npmrc uses public npm registry', () =>
    withGenerated(async (out) => {
      const npmrc = await readFile(join(out, '.npmrc'), 'utf-8');
      expect(npmrc).toContain('https://registry.npmjs.org');
      expect(npmrc).not.toContain('verdaccio');
    }));
});
