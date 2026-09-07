const path = require('node:path');
const assert = require('node:assert/strict');
const P = require('./profile.cjs');

// The rejection function takes no real implementation and cannot delegate to one.
exports.rejectCall = (p, phase, kind, port = 'unknown', role = 'core_host') => {
  assert.ok(['preparation', 'recovery'].includes(phase));
  assert.ok(['provider', 'executor'].includes(kind));
  assert.ok(['unknown', 'spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync'].includes(port));
  assert.ok(['core_host', 'desktop_main'].includes(role));
  P.atomic(path.join(p.control, 'guard-call.json'), { role, port });
  P.count(p, kind === 'provider' ? phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls'
    : phase === 'preparation' ? 'preparationExecutorCalls' : 'recoveryExecutorCalls');
  throw new Error('RECOVERY_TEST_FORBIDDEN_CALL');
};
