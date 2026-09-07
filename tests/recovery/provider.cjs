const assert = require('node:assert/strict');
const P = require('./profile.cjs');
exports.provider = (p, phase) => ({
  startTextTurn: async function* (_request, context) {
    P.count(p, phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls');
    assert.equal(phase, 'preparation', 'RECOVERY_PROVIDER_FORBIDDEN');
    assert.equal(p.scenario, 'B'); assert.equal(P.counts(p).preparationFakeProviderCalls, 1);
    yield { type: 'tool_proposal', proposal: { turnId: context.tool.turnId, proposalId: context.tool.proposalId,
      toolId: 'localApp.open', risk: 'mutating', arguments: { app: 'notepad' },
      proposedAt: new Date().toISOString(), safeSummary: 'Synthetic bounded proposal' } };
  },
  continueTextTurn: async function* () {
    P.count(p, phase === 'preparation' ? 'preparationFakeProviderCalls' : 'recoveryProviderCalls');
    throw new Error('CONTINUATION_FORBIDDEN');
  },
});
exports.input = () => ({ assistantInput: { kind: 'text', source: 'user', text: 'Synthetic recovery preparation.' },
  source: 'text', text: 'Synthetic recovery preparation.', decision: { intent: 'chat.answer', confidence: 1,
    requiresApproval: false, slots: {}, reason: 'synthetic' }, conversationId: 'primary', correlationId: 'synthetic-command',
  preferenceProjection: { status: 'none', appliesTo: 'chat.answer', source: 'none', rawContentExposed: false,
    vectorRetrievalUsed: false, providerNeutral: true } });
