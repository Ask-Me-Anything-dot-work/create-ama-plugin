import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { ScaffoldConfig } from './config';
import { interpolateTemplate } from './config';
import { consolePanelFiles } from './templates/console-panel';
import { migrationFiles } from './templates/migrations';

const TEXT_EXTENSIONS = new Set(['.ts', '.json', '.md', '.yml', '.yaml', '.mjs', '.sh']);

const SKIP_INTERPOLATION = new Set(['bun.lock', '.gitkeep']);

export async function readTemplateFiles(
  templateDir: string,
): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relPath = relative(templateDir, fullPath);
        const content = await readFile(fullPath, 'utf-8');
        files.set(relPath, content);
      }
    }
  }

  await walk(templateDir);
  return files;
}

export function filterFiles(
  files: Map<string, string>,
  config: ScaffoldConfig,
): Map<string, string> {
  const filtered = new Map<string, string>();

  for (const [path, content] of files) {
    if (!config.consolePanel && path.startsWith('src/panels/')) continue;
    if (!config.migrations && path.startsWith('migrations/')) continue;
    filtered.set(path, content);
  }

  return filtered;
}

export function interpolateContent(
  content: string,
  path: string,
  config: ScaffoldConfig,
): string {
  const ext = '.' + path.split('.').pop();
  if (SKIP_INTERPOLATION.has(path)) return content;
  if (!TEXT_EXTENSIONS.has(ext)) return content;

  return interpolateTemplate(content, config);
}

export function getExtraFiles(config: ScaffoldConfig): Map<string, string> {
  const extra = new Map<string, string>();

  if (config.consolePanel) {
    for (const [path, content] of consolePanelFiles) {
      extra.set(path, content);
    }
  }

  if (config.migrations) {
    for (const [path, content] of migrationFiles) {
      extra.set(path, content);
    }
  }

  return extra;
}

export async function generate(
  config: ScaffoldConfig,
  targetDir: string,
  templateDir: string,
): Promise<void> {
  const templateFiles = await readTemplateFiles(templateDir);
  const filtered = filterFiles(templateFiles, config);

  const allFiles = new Map<string, string>();

  for (const [path, content] of filtered) {
    allFiles.set(path, interpolateContent(content, path, config));
  }

  const extraFiles = getExtraFiles(config);
  for (const [path, content] of extraFiles) {
    allFiles.set(path, interpolateTemplate(content, config));
  }

  for (const [path, content] of allFiles) {
    const filePath = join(targetDir, path);
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, content, 'utf-8');
  }
}
