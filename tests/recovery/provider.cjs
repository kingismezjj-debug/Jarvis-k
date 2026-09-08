const assert = require('node:assert/strict');
const P = require('./profile.cjs');
const M = require('./provider-mode.cjs');
exports.provider = (p, phase, mode) => {
  M.factory(p,phase,mode);
  M.record(p,phase,mode,'instantiated');
  return ({
  startTextTurn: async function* (_request, context) {
    M.transport(p,phase,mode);
    P.count(p, phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls');
    assert.equal(phase, 'preparation', 'RECOVERY_PROVIDER_FORBIDDEN');
    assert.equal(p.scenario, 'B'); assert.equal(P.counts(p).preparationFakeProviderCalls, 1);
    yield { type: 'tool_proposal', proposal: { turnId: context.tool.turnId, proposalId: context.tool.proposalId,
      toolId: 'localApp.open', risk: 'mutating', arguments: { app: 'notepad' },
      proposedAt: new Date().toISOString(), safeSummary: 'Synthetic bounded proposal' } };
  },
  continueTextTurn: async function* () {
    M.forbid(p,phase,mode,'transport');
    P.count(p, phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls');
    throw new Error('CONTINUATION_FORBIDDEN');
  },
});
};
exports.input = () => ({ assistantInput: { kind: 'text', source: 'user', text: 'Synthetic recovery preparation.' },
  source: 'text', text: 'Synthetic recovery preparation.', decision: { intent: 'chat.answer', confidence: 1,
    requiresApproval: false, slots: {}, reason: 'synthetic' }, conversationId: 'primary', correlationId: 'synthetic-command',
  preferenceProjection: { status: 'none', appliesTo: 'chat.answer', source: 'none', rawContentExposed: false,
    vectorRetrievalUsed: false, providerNeutral: true } });
