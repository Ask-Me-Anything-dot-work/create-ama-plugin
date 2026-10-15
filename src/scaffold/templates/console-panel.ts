export const consolePanelFiles = new Map<string, string>([
  [
    'src/panels/console.ts',
    `import type { ConsolePanel } from '@ama-work/plugin-contract';

export const consolePanel: ConsolePanel = {
  id: '{{PLUGIN_ID}}-console',
  navLabel: '{{PLUGIN_ID}}',
  icon: 'settings',
  mixinUrl: '/plugins/@ama-work/{{PLUGIN_ID}}/mixin.js',
  templateUrl: '/plugins/@ama-work/{{PLUGIN_ID}}/template.html',
};
`,
  ],
  [
    'src/panels/template.ts',
    `// Panel HTML embedded as a string: tsc does not copy .html files into dist/.
// Contract: fragment only — no <!doctype>, <html>, <head>, <body>, or <style>.
// The console injects this via innerHTML; full documents break the shell layout.
export const templateHtml = \`<div id="{{PLUGIN_ID}}-root" style="padding: 1rem;">
  <h1>{{PLUGIN_ID}}</h1>
  <p>Console panel scaffold — replace this markup with your plugin UI.</p>
</div>
\`;
`,
  ],
  [
    'src/panels/mixin.ts',
    `// Panel behavior embedded as a string: tsc does not copy .js files into dist/.
export const mixinJs = \`// {{PLUGIN_ID}} console panel mixin
console.log('{{PLUGIN_ID}} panel mixin loaded');
\`;
`,
  ],
  [
    'src/panels/routes.ts',
    `import { Hono } from 'hono';
import { mixinJs } from './mixin';
import { templateHtml } from './template';

// The orchestrator mounts this router at /plugins/@ama-work/{{PLUGIN_ID}}/,
// so paths here are relative to that prefix.
export function createPanelRouter(): Hono {
  const router = new Hono();

  router.get('/template.html', (c) => c.html(templateHtml));
  router.get('/mixin.js', () =>
    new Response(mixinJs, {
      status: 200,
      headers: { 'Content-Type': 'text/javascript; charset=UTF-8' },
    }),
  );

  return router;
}
`,
  ],
  [
    'src/panels/index.ts',
    `export { consolePanel } from './console';
export { createPanelRouter } from './routes';
`,
  ],
  [
    'src/index.ts',
    `import type { OrchestratorPlugin, PluginBridge } from '@ama-work/plugin-contract';
import { consolePanel, createPanelRouter } from './panels';

const plugin: OrchestratorPlugin = {
  id: '{{PLUGIN_ID}}',
  async onStart(bridge: PluginBridge) {
    bridge.mountConsolePanel(consolePanel);
    bridge.mountRoutes(createPanelRouter());
    bridge.logger.info('{{PLUGIN_ID}} plugin started');
  },
  async onStop() {
    // cleanup
  },
};

// Named export is the orchestrator loader contract (ama-agent-orchestrator#642).
export { plugin };
// Default re-export is optional, kept for backward compatibility only.
export default plugin;
`,
  ],
]);
