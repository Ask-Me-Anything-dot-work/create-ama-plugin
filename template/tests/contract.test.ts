import { expect, test } from 'bun:test';
import * as mod from '../src/index';

interface ResolvedPlugin {
  id?: unknown;
  onStart?: unknown;
  onStop?: unknown;
}

// Mirrors the orchestrator registry's resolution helper (ama-agent-orchestrator#642):
// named `plugin` export wins, default export is the tolerated fallback.
test('module satisfies the orchestrator export contract', () => {
  const ns = mod as unknown as Record<string, unknown>;
  const resolved = (ns.plugin ?? ns.default) as ResolvedPlugin;

  expect(typeof resolved.id).toBe('string');
  expect(typeof resolved.onStart).toBe('function');
  expect(typeof resolved.onStop).toBe('function');
});

test('named plugin export is present', () => {
  const ns = mod as unknown as Record<string, unknown>;
  expect('plugin' in ns).toBe(true);
});
