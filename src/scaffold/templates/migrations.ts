export const migrationFiles = new Map<string, string>([
  ['migrations/.gitkeep', ''],
  [
    'migrations/README.md',
    `# Migrations

Database migrations for the {{PLUGIN_ID}} plugin.

Place migration files here. Each migration should be a named SQL or TypeScript file.`,
  ],
]);
