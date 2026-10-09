import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { generate } from '../../src/scaffold/generator';
import {
  HOOK_TIMEOUT_MS,
  INSTALL_TIMEOUT_MS,
  REGISTRY_PROBE_TIMEOUT_MS,
  SELF_TEST_SPAWN_TIMEOUT_MS,
  SELF_TEST_TIMEOUT_MS,
  TEMPLATE_DIR,
  makeConfig,
  spawnOk,
} from './helpers';

async function isPackageAvailable(): Promise<boolean> {
  try {
    const result = Bun.spawnSync(['npm', 'view', '@ama-work/plugin-contract', 'version'], {
      timeout: REGISTRY_PROBE_TIMEOUT_MS,
    });
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
  }, HOOK_TIMEOUT_MS);

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  }, HOOK_TIMEOUT_MS);

  test('generated project passes bun install and bun test', async () => {
    if (!(await isPackageAvailable())) {
      console.log('Skipping self-test: @ama-work/plugin-contract not published to npm');
      return;
    }

    const out = join(tmpDir, 'generated');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    spawnOk(['bun', 'install'], out, INSTALL_TIMEOUT_MS);
    spawnOk(['bun', 'test'], out, SELF_TEST_SPAWN_TIMEOUT_MS);
  }, SELF_TEST_TIMEOUT_MS);

  test('generated project builds dist/index.js satisfying export contract', async () => {
    if (!(await isPackageAvailable())) {
      console.log('Skipping build self-test: @ama-work/plugin-contract not published to npm');
      return;
    }

    const out = join(tmpDir, 'build-test');
    await generate(makeConfig(), out, TEMPLATE_DIR);
    spawnOk(['bun', 'install'], out, INSTALL_TIMEOUT_MS);
    spawnOk(['bun', 'run', 'build'], out, SELF_TEST_SPAWN_TIMEOUT_MS);

    const fileStat = await stat(join(out, 'dist/index.js'));
    expect(fileStat.isFile()).toBe(true);

    const pkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf-8'));
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.module).toBe('dist/index.js');

    // Mirrors the orchestrator registry's resolution helper (ama-agent-orchestrator#642).
    const mod = (await import(pathToFileURL(join(out, 'dist/index.js')).href)) as Record<
      string,
      unknown
    >;
    const resolved = (mod.plugin ?? mod.default) as Record<string, unknown>;
    expect(typeof resolved.id).toBe('string');
    expect(typeof resolved.onStart).toBe('function');
    expect(typeof resolved.onStop).toBe('function');
  }, SELF_TEST_TIMEOUT_MS);
});
