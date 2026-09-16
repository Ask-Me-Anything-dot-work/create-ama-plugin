import { z } from 'zod';

export const scaffoldConfigSchema = z.object({
  pluginId: z
    .string()
    .min(1, 'Plugin ID is required')
    .regex(
      /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
      'Plugin ID must be kebab-case (e.g. my-plugin)',
    ),
  provides: z.string().min(1, 'Provides type is required').default('generic'),
  consolePanel: z.boolean().default(false),
  migrations: z.boolean().default(false),
});

export type ScaffoldConfig = z.infer<typeof scaffoldConfigSchema>;

export function validateConfig(input: unknown): ScaffoldConfig {
  return scaffoldConfigSchema.parse(input);
}

export function interpolateTemplate(
  content: string,
  config: ScaffoldConfig,
): string {
  return content
    .replaceAll('{{PLUGIN_ID}}', config.pluginId)
    .replaceAll('{{PROVIDES_TYPE}}', config.provides);
}
