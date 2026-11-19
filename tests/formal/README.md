# Formal verification stubs

The Rust model in `interest_rate_monotonicity.rs` captures the safety and
monotonicity obligations for interest accrual without depending on the
production contract. Run the executable checks with:

```bash
just formal
```

When Kani is installed, the `kani` harness can be selected from the same file
for bounded exhaustive checking.
