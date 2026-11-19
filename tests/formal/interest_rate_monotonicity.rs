//! Formal verification stubs for interest-rate monotonicity.
//!
//! The pure model is intentionally independent from Soroban so it can be run
//! by rustc in CI and used as a seed for Kani or another bounded verifier.

const BPS: u128 = 10_000;

pub fn interest(principal: u128, rate_bps: u128, elapsed: u128) -> Option<u128> {
    let principal_rate = principal.checked_mul(rate_bps)?;
    principal_rate.checked_mul(elapsed)?.checked_div(BPS)
}

#[test]
fn interest_is_monotone_in_principal() {
    let rate = 500;
    let elapsed = 31_536_000;
    let values = [0, 1, 1_000, 1_000_000];
    for pair in values.windows(2) {
        assert!(interest(pair[0], rate, elapsed) <= interest(pair[1], rate, elapsed));
    }
}

#[test]
fn interest_is_monotone_in_elapsed_time() {
    let principal = 1_000_000;
    let rate = 500;
    let values = [0, 1, 86_400, 31_536_000];
    for pair in values.windows(2) {
        assert!(interest(principal, rate, pair[0]) <= interest(principal, rate, pair[1]));
    }
}

#[test]
fn overflow_is_reported_instead_of_wrapping() {
    assert_eq!(interest(u128::MAX, u128::MAX, 2), None);
}

#[cfg(kani)]
#[kani::proof]
fn kani_interest_is_monotone() {
    let principal_a: u128 = kani::any();
    let principal_b: u128 = kani::any();
    let rate: u128 = kani::any();
    let elapsed: u128 = kani::any();
    kani::assume(principal_a <= principal_b);
    kani::assume(rate <= 10_000);
    kani::assume(elapsed <= 31_536_000);

    if let (Some(a), Some(b)) = (
        interest(principal_a, rate, elapsed),
        interest(principal_b, rate, elapsed),
    ) {
        kani::assert(a <= b);
    }
}
