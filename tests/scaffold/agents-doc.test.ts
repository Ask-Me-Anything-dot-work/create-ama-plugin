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

async function readAgentsMd(overrides: Partial<ScaffoldConfig> = {}): Promise<string> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const out = join(tmpdir(), `agents-doc-${suffix}`);
  try {
    await generate(makeConfig(overrides), out, TEMPLATE_DIR);
    return await readFile(join(out, 'AGENTS.md'), 'utf-8');
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

describe('AGENTS.md doc currency', () => {
  test('documents the named plugin export contract', async () => {
    const agents = await readAgentsMd();
    expect(agents).toContain('`src/index.ts`: Plugin entrypoint');
    expect(agents).toContain('named `plugin` object');
    expect(agents).toContain('`mod.plugin ?? mod.default`');
    expect(agents).toContain('`export default plugin` is optional');
    expect(agents).toContain('tests/contract.test.ts');
  });

  test('drops stale health-route and Hono-app framing', async () => {
    const agents = await readAgentsMd();
    expect(agents).not.toContain('/health');
    expect(agents).not.toContain('Hono app');
    expect(agents).not.toMatch(/`src\/index\.ts`:[^\n]*Hono/);
  });

  test('mentions src/panels/ for the --console-panel variant', async () => {
    const agents = await readAgentsMd();
    expect(agents).toContain('`src/panels/`');
    expect(agents).toContain('`--console-panel`');
    expect(agents).toContain('/plugins/@ama-work/test-plugin/');
  });

  test('interpolates the plugin id', async () => {
    const agents = await readAgentsMd();
    expect(agents).toContain('test-plugin');
    expect(agents).not.toContain('{{PLUGIN_ID}}');
  });
});
