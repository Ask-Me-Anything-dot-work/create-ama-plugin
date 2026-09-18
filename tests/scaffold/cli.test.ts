import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { readdir, rm, readFile, mkdir } from 'node:fs/promises';
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

async function listFiles(dir: string): Promise<string[]> {
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

describe('conditional combos', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `cli-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('console=yes, migrations=yes', async () => {
    const out = join(tmpDir, 'both');
    await generate(makeConfig({ consolePanel: true, migrations: true }), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    expect(files.some((f) => f.includes('src/panels/console.ts'))).toBe(true);
    expect(files.some((f) => f.includes('migrations/.gitkeep'))).toBe(true);
  });

  test('console=yes, migrations=no', async () => {
    const out = join(tmpDir, 'console');
    await generate(makeConfig({ consolePanel: true, migrations: false }), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    expect(files.some((f) => f.includes('src/panels/'))).toBe(true);
    expect(files.some((f) => f.includes('migrations/'))).toBe(false);
  });

  test('console=no, migrations=yes', async () => {
    const out = join(tmpDir, 'migrations');
    await generate(makeConfig({ consolePanel: false, migrations: true }), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    expect(files.some((f) => f.includes('src/panels/'))).toBe(false);
    expect(files.some((f) => f.includes('migrations/'))).toBe(true);
  });

  test('console=no, migrations=no', async () => {
    const out = join(tmpDir, 'base');
    await generate(makeConfig({ consolePanel: false, migrations: false }), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    expect(files.some((f) => f.includes('src/panels/'))).toBe(false);
    expect(files.some((f) => f.includes('migrations/'))).toBe(false);
  });
});

describe('interpolation', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `cli-int-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('package.json name matches scoped plugin ID', async () => {
    const out = join(tmpDir, 'pkg');
    await generate(makeConfig({ pluginId: 'my-cool-plugin' }), out, TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('@ama-work/my-cool-plugin');
  });

  test('package.json has public scoped access in publishConfig', async () => {
    const out = join(tmpDir, 'access');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.publishConfig.access).toBe('public');
    expect(pkg.publishConfig.registry).toBe('https://registry.npmjs.org');
  });

  test('README title matches scoped plugin ID', async () => {
    const out = join(tmpDir, 'readme');
    await generate(makeConfig({ pluginId: 'my-plugin' }), out, TEMPLATE_DIR);
    const readme = await readFile(join(out, 'README.md'), 'utf-8');
    expect(readme).toContain('# @ama-work/my-plugin');
  });

  test('generated package.json has main entrypoint', async () => {
    const out = join(tmpDir, 'entrypoint');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.main).toBe('dist/index.js');
  });
});

describe('generated project structure', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `cli-struct-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('base template files always present', async () => {
    const out = join(tmpDir, 'base');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    for (const f of ['package.json', 'src/index.ts', 'tsconfig.json', '.gitignore']) {
      expect(files.includes(f)).toBe(true);
    }
  });

  test('generated project has plugin-contract dependency', async () => {
    const out = join(tmpDir, 'deps');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.dependencies['@ama-work/plugin-contract']).toBe('^1.0.1');
  });

  test('generated project has plugin test file', async () => {
    const out = join(tmpDir, 'test');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    const files = await listFiles(out);
    expect(files.some((f) => f.includes('tests/plugin.test.ts'))).toBe(true);
    expect(files.some((f) => f.includes('tests/health.test.ts'))).toBe(false);
  });

  test('generated project can be packed', async () => {
    const out = join(tmpDir, 'pack');
    await generate(makeConfig({ pluginId: 'pack-test' }), out, TEMPLATE_DIR);
    const result = Bun.spawnSync(['npm', 'pack', '--dry-run'], {
      cwd: out,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    expect(result.exitCode).toBe(0);
  });
});
