import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { readdir, rm, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readTemplateFiles,
  filterFiles,
  interpolateContent,
  generate,
  getExtraFiles,
} from '../../src/scaffold/generator';
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

async function dirExists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

describe('readTemplateFiles', () => {
  test('reads all files from template directory', async () => {
    const files = await readTemplateFiles(TEMPLATE_DIR);
    expect(files.size).toBeGreaterThan(0);
    expect(files.has('package.json')).toBe(true);
    expect(files.has('src/index.ts')).toBe(true);
  });
});

describe('filterFiles', () => {
  const files = new Map<string, string>([
    ['package.json', '{}'],
    ['src/index.ts', 'code'],
    ['src/panels/console.ts', 'panel'],
    ['src/panels/index.ts', 'barrel'],
    ['migrations/.gitkeep', ''],
    ['migrations/README.md', 'docs'],
  ]);

  test('includes all files when both options true', () => {
    const result = filterFiles(files, makeConfig({ consolePanel: true, migrations: true }));
    expect(result.size).toBe(6);
  });

  test('excludes console panel files when consolePanel false', () => {
    const result = filterFiles(files, makeConfig({ consolePanel: false, migrations: true }));
    expect(result.has('src/panels/console.ts')).toBe(false);
    expect(result.has('migrations/.gitkeep')).toBe(true);
  });

  test('excludes migrations files when migrations false', () => {
    const result = filterFiles(files, makeConfig({ consolePanel: true, migrations: false }));
    expect(result.has('src/panels/console.ts')).toBe(true);
    expect(result.has('migrations/.gitkeep')).toBe(false);
  });

  test('excludes both when both false', () => {
    const result = filterFiles(files, makeConfig({ consolePanel: false, migrations: false }));
    expect(result.size).toBe(2);
    expect(result.has('package.json')).toBe(true);
  });
});

describe('interpolateContent', () => {
  const config = makeConfig({ pluginId: 'my-plugin', provides: 'hook' });

  test('interpolates .ts files', () => {
    expect(interpolateContent('{{PLUGIN_ID}}', 'src/index.ts', config)).toBe('my-plugin');
  });

  test('interpolates .json files', () => {
    expect(interpolateContent('{{PLUGIN_ID}}', 'package.json', config)).toBe('my-plugin');
  });

  test('skips interpolation for bun.lock', () => {
    expect(interpolateContent('{{PLUGIN_ID}}', 'bun.lock', config)).toBe('{{PLUGIN_ID}}');
  });

  test('skips interpolation for .gitkeep', () => {
    expect(interpolateContent('{{PLUGIN_ID}}', 'migrations/.gitkeep', config)).toBe('{{PLUGIN_ID}}');
  });
});

describe('getExtraFiles', () => {
  test('returns empty map when both false', () => {
    expect(getExtraFiles(makeConfig()).size).toBe(0);
  });

  test('returns console panel files when true', () => {
    const extra = getExtraFiles(makeConfig({ consolePanel: true }));
    expect(extra.has('src/panels/console.ts')).toBe(true);
    expect(extra.has('src/panels/index.ts')).toBe(true);
  });

  test('returns migration files when true', () => {
    const extra = getExtraFiles(makeConfig({ migrations: true }));
    expect(extra.has('migrations/.gitkeep')).toBe(true);
    expect(extra.has('migrations/README.md')).toBe(true);
  });
});

describe('generate', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `scaffold-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test('generates base scaffold with correct scoped package name', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(tmpDir, 'output/package.json'), 'utf-8'));
    expect(pkg.name).toBe('@ama-work/test-plugin');
  });

  test('README title matches scoped plugin ID', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const readme = await readFile(join(tmpDir, 'output/README.md'), 'utf-8');
    expect(readme).toContain('# @ama-work/test-plugin');
  });

  test('includes console panel when enabled', async () => {
    await generate(makeConfig({ consolePanel: true }), join(tmpDir, 'output'), TEMPLATE_DIR);
    const panel = await readFile(join(tmpDir, 'output/src/panels/console.ts'), 'utf-8');
    expect(panel).toContain('test-plugin');
  });

  test('excludes console panel when disabled', async () => {
    await generate(makeConfig({ consolePanel: false }), join(tmpDir, 'output'), TEMPLATE_DIR);
    expect(await dirExists(join(tmpDir, 'output/src/panels'))).toBe(false);
  });

  test('includes migrations when enabled', async () => {
    await generate(makeConfig({ migrations: true }), join(tmpDir, 'output'), TEMPLATE_DIR);
    const migrationReadme = await readFile(join(tmpDir, 'output/migrations/README.md'), 'utf-8');
    expect(migrationReadme).toContain('test-plugin');
  });

  test('excludes migrations when disabled', async () => {
    await generate(makeConfig({ migrations: false }), join(tmpDir, 'output'), TEMPLATE_DIR);
    expect(await dirExists(join(tmpDir, 'output/migrations'))).toBe(false);
  });

  test('generated package.json declares main entrypoint as dist/index.js', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(tmpDir, 'output/package.json'), 'utf-8'));
    expect(pkg.main).toBe('dist/index.js');
  });

  test('generated package.json includes dist in files array', async () => {
    await generate(makeConfig(), join(tmpDir, 'output'), TEMPLATE_DIR);
    const pkg = JSON.parse(await readFile(join(tmpDir, 'output/package.json'), 'utf-8'));
    expect(pkg.files).toContain('dist');
  });
});
