import { expect, test, describe } from 'bun:test';
import { MockBridge } from '@ama-work/plugin-contract';
import plugin from '../src/index';

describe('Plugin', () => {
  test('has correct id', () => {
    expect(plugin.id).toBe('{{PLUGIN_ID}}');
  });

  test('onStart logs startup message', async () => {
    const bridge = new MockBridge();
    const logs: string[] = [];
    bridge.logger.info = (msg: string) => logs.push(msg);

    await plugin.onStart(bridge);
    expect(logs).toContain('{{PLUGIN_ID}} plugin started');
  });

  test('onStop completes without error', async () => {
    await expect(plugin.onStop()).resolves.toBeUndefined();
  });
});
