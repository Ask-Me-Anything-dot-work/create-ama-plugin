import { text, confirm, intro, outro } from '@clack/prompts';
import { scaffoldConfigSchema, type ScaffoldConfig } from './config';

export async function collectConfig(): Promise<ScaffoldConfig | null> {
  intro('create-ama-plugin — scaffold a new Orchestrator plugin');

  const pluginId = await text({
    message: 'Plugin ID (kebab-case, e.g. my-plugin):',
    validate: (value) => {
      const result = scaffoldConfigSchema.shape.pluginId.safeParse(value);
      if (!result.success) return result.error.issues[0].message;
    },
  });

  if (typeof pluginId === 'symbol') return null;

  const provides = await text({
    message: 'Provides type:',
    defaultValue: 'generic',
  });

  if (typeof provides === 'symbol') return null;

  const consolePanel = await confirm({
    message: 'Include console panel scaffold?',
    initialValue: false,
  });

  if (typeof consolePanel === 'symbol') return null;

  const migrations = await confirm({
    message: 'Include migrations scaffold?',
    initialValue: false,
  });

  if (typeof migrations === 'symbol') return null;

  const config = scaffoldConfigSchema.parse({
    pluginId,
    provides,
    consolePanel,
    migrations,
  });

  outro(`Scaffold configuration collected for "${config.pluginId}"`);
  return config;
}

export function parseArgs(
  args: string[],
): Partial<ScaffoldConfig> | null {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && i + 1 < args.length) {
      parsed.pluginId = args[++i];
    } else if (arg === '--provides' && i + 1 < args.length) {
      parsed.provides = args[++i];
    } else if (arg === '--console-panel') {
      parsed.consolePanel = true;
    } else if (arg === '--migrations') {
      parsed.migrations = true;
    } else if (arg === '--no-console-panel') {
      parsed.consolePanel = false;
    } else if (arg === '--no-migrations') {
      parsed.migrations = false;
    } else if (arg === '--help' || arg === '-h') {
      return null;
    }
  }

  return Object.keys(parsed).length > 0 ? parsed as Partial<ScaffoldConfig> : null;
}

export function printHelp(): void {
  console.log(`Usage: bun create-ama-plugin [options]

Options:
  --name <id>            Plugin ID (kebab-case)
  --provides <type>      Provides type (default: generic)
  --console-panel        Include console panel scaffold
  --no-console-panel     Exclude console panel scaffold
  --migrations           Include migrations scaffold
  --no-migrations        Exclude migrations scaffold
  --help, -h             Show this help message

Interactive mode starts when no --name is provided.`);
}
