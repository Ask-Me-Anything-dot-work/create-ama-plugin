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

export default plugin;
