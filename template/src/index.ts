import type { OrchestratorPlugin, PluginBridge } from '@ama-work/plugin-contract';

const plugin: OrchestratorPlugin = {
  id: '{{PLUGIN_ID}}',
  async onStart(bridge: PluginBridge) {
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
