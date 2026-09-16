#!/usr/bin/env bun

import { resolve } from 'node:path';
import { collectConfig, parseArgs, printHelp } from './src/scaffold/prompts';
import { scaffoldConfigSchema } from './src/scaffold/config';
import { generate } from './src/scaffold/generator';

const TEMPLATE_DIR = resolve(import.meta.dir, 'template');

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args === null) {
    printHelp();
    process.exit(0);
  }

  let config;

  if (args.pluginId) {
    config = scaffoldConfigSchema.parse(args);
  } else {
    const collected = await collectConfig();
    if (!collected) {
      process.exit(1);
    }
    config = collected;
  }

  const targetDir = resolve(process.cwd(), config.pluginId);

  console.log(`\nScaffolding "${config.pluginId}" to ${targetDir}...`);

  await generate(config, targetDir, TEMPLATE_DIR);

  console.log(`Done! Created plugin scaffold at ${targetDir}`);
  console.log('\nNext steps:');
  console.log(`  cd ${config.pluginId}`);
  console.log('  bun install');
  console.log('  bun run dev');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
