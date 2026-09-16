export const consolePanelFiles = new Map<string, string>([
  [
    'src/panels/console.ts',
    `import type { ConsolePanel } from '@ama-plugin-contract/console';

export const consolePanel: ConsolePanel = {
  name: '{{PLUGIN_ID}}-console',
  description: 'Console panel for {{PLUGIN_ID}} plugin',
  render() {
    return '<div>{{PLUGIN_ID}} console panel</div>';
  },
};
`,
  ],
  [
    'src/panels/index.ts',
    `export { consolePanel } from './console';
`,
  ],
]);
