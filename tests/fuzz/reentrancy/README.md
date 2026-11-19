# Per-caller reentrancy fuzz harness

This harness generates state-changing call sequences for multiple callers and
checks two invariants:

- a caller cannot re-enter a state-changing action while its own action is
  active;
- blocking one caller does not block an independent caller.

Run it with:

```bash
just fuzz-reentrancy
```

The model is deliberately independent of a particular contract implementation.
It is a fast regression gate for the caller-isolation invariant and can be
extended with Soroban transaction traces when the integration harness exposes
them.
