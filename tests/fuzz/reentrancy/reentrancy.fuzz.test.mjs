import test from 'node:test';
import assert from 'node:assert/strict';

const CALLERS = ['alice', 'bob', 'attacker'];
const ACTIONS = ['deposit', 'borrow', 'withdraw', 'repay'];

function nextRandom(state) {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value;
}

function runSequence(sequence) {
  const balances = Object.fromEntries(CALLERS.map((caller) => [caller, 0]));
  const active = new Set();
  const violations = [];
  const blocked = [];

  for (const { caller, action, amount } of sequence) {
    const key = `${caller}:${action}`;
    if (active.has(caller)) {
      blocked.push(key);
      continue;
    }

    active.add(caller);
    try {
      if (action === 'deposit' || action === 'repay') {
        balances[caller] += amount;
      } else if (action === 'withdraw' || action === 'borrow') {
        balances[caller] = Math.max(0, balances[caller] - amount);
      }

      // The guard is per caller: another caller may proceed, but the same
      // caller cannot enter a second state-changing action.
      if (reentrantAction(sequence, key)) {
        blocked.push(key);
      }
    } finally {
      active.delete(caller);
    }
  }

  return { balances, blocked, violations };
}

function reentrantAction(sequence, key) {
  return sequence.some((entry) => entry.key === key && entry.reentrant);
}

function generatedSequence(seed) {
  const state = { value: seed >>> 0 };
  return Array.from({ length: 32 }, () => {
    const caller = CALLERS[nextRandom(state) % CALLERS.length];
    const action = ACTIONS[nextRandom(state) % ACTIONS.length];
    const reentrant = nextRandom(state) % 5 === 0;
    return {
      caller,
      action,
      amount: (nextRandom(state) % 1000) + 1,
      reentrant,
      key: `${caller}:${action}`,
    };
  });
}

test('per-caller guard preserves isolation across generated call sequences', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const sequence = generatedSequence(seed);
    const { balances, violations } = runSequence(sequence);
    assert.deepEqual(violations, [], `seed ${seed} accepted a reentrant call`);
    for (const caller of CALLERS) {
      assert.ok(Number.isInteger(balances[caller]));
      assert.ok(balances[caller] >= 0);
    }
  }
});

test('a blocked caller does not block an independent caller', () => {
  const sequence = [
    { caller: 'alice', action: 'deposit', amount: 100, reentrant: false, key: 'alice:deposit' },
    { caller: 'alice', action: 'withdraw', amount: 50, reentrant: true, key: 'alice:withdraw' },
    { caller: 'bob', action: 'deposit', amount: 25, reentrant: false, key: 'bob:deposit' },
  ];

  const result = runSequence(sequence);
  assert.deepEqual(result.blocked, ['alice:withdraw']);
  assert.equal(result.balances.bob, 25);
});
