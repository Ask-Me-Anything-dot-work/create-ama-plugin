import { expect, test, describe } from 'bun:test';
import { rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generate, getExtraFiles } from '../../src/scaffold/generator';
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
  const out = join(tmpdir(), `panel-${suffix}`);
  try {
    await generate(makeConfig(overrides), out, TEMPLATE_DIR);
    await run(out);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

async function readOutput(out: string, path: string): Promise<string> {
  return readFile(join(out, path), 'utf-8');
}

describe('console panel scaffold', () => {
  test('generates panel asset modules', () =>
    withGenerated(async (out) => {
      const template = await readOutput(out, 'src/panels/template.ts');
      expect(template).toContain('templateHtml');

      const mixin = await readOutput(out, 'src/panels/mixin.ts');
      expect(mixin).toContain('mixinJs');

      const routes = await readOutput(out, 'src/panels/routes.ts');
      expect(routes).toContain("router.get('/template.html'");
      expect(routes).toContain("router.get('/mixin.js'");
      expect(routes).toContain('createPanelRouter');
    }, { consolePanel: true }));

  test('panel URLs use orchestrator plugin route prefix', () =>
    withGenerated(async (out) => {
      const panel = await readOutput(out, 'src/panels/console.ts');
      expect(panel).toContain("templateUrl: '/plugins/@ama-work/test-plugin/template.html'");
      expect(panel).toContain("mixinUrl: '/plugins/@ama-work/test-plugin/mixin.js'");
    }, { consolePanel: true }));

  test('hono dependency injected only when console panel enabled', () =>
    withGenerated(async (out) => {
      const pkg = JSON.parse(await readOutput(out, 'package.json'));
      expect(pkg.dependencies.hono).toBe('^4.8.0');
      expect(pkg.dependencies['@ama-work/plugin-contract']).toBe('^1.0.1');
    }, { consolePanel: true }));

  test('panel entrypoint mounts console panel and asset routes', () =>
    withGenerated(async (out) => {
      const index = await readOutput(out, 'src/index.ts');
      expect(index).toContain('export { plugin }');
      expect(index).toContain('bridge.mountConsolePanel(consolePanel)');
      expect(index).toContain('bridge.mountRoutes(createPanelRouter())');
      expect(index).toContain("id: 'test-plugin'");
    }, { consolePanel: true }));
});

describe('console panel disabled', () => {
  test('base scaffold has no hono dependency', () =>
    withGenerated(async (out) => {
      const pkg = JSON.parse(await readOutput(out, 'package.json'));
      expect(pkg.dependencies.hono).toBeUndefined();
    }));

  test('base entrypoint has no panel wiring', () =>
    withGenerated(async (out) => {
      const index = await readOutput(out, 'src/index.ts');
      expect(index).toContain('export { plugin }');
      expect(index).not.toContain('mountConsolePanel');
      expect(index).not.toContain('mountRoutes');
    }));

  test('panel scaffold overrides base entrypoint', () => {
    const extra = getExtraFiles(makeConfig({ consolePanel: true }));
    expect(extra.has('src/index.ts')).toBe(true);
    expect(extra.has('src/panels/routes.ts')).toBe(true);

    const baseExtra = getExtraFiles(makeConfig({ consolePanel: false }));
    expect(baseExtra.has('src/index.ts')).toBe(false);
  });
});
