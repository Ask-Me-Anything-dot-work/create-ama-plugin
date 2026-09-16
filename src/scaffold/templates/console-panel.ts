export const consolePanelFiles = new Map<string, string>([
  [
    'src/panels/console.ts',
    `import type { ConsolePanel } from '@ama-work/plugin-contract';

export const consolePanel: ConsolePanel = {
  id: '{{PLUGIN_ID}}-console',
  navLabel: '{{PLUGIN_ID}}',
  icon: 'settings',
  mixinUrl: '',
  templateUrl: '',
};
`,
  ],
  [
    'src/panels/index.ts',
    `export { consolePanel } from './console';
`,
  ],
]);
