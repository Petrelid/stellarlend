set shell := ["bash", "-euo", "-c"]

default:
    @just --list

fmt:
    cargo fmt --manifest-path stellar-lend/Cargo.toml --all -- --check

check:
    cargo check --manifest-path stellar-lend/Cargo.toml --workspace --all-targets

test:
    cargo test --manifest-path stellar-lend/Cargo.toml --workspace

clippy:
    cargo clippy --manifest-path stellar-lend/Cargo.toml --workspace --all-targets --all-features -- -D warnings

formal:
    rustc --edition=2021 --test tests/formal/interest_rate_monotonicity.rs -o /tmp/stellarlend-formal-tests
    /tmp/stellarlend-formal-tests

fuzz-reentrancy:
    node --test tests/fuzz/reentrancy/reentrancy.fuzz.test.mjs

devnet:
    bash scripts/devnet/bootstrap.sh

devnet-reset:
    bash scripts/devnet/bootstrap.sh --reset

local-net:
    docker compose -f docker/local-net/docker-compose.yml up -d

local-net-down:
    docker compose -f docker/local-net/docker-compose.yml down

docker-config:
    docker compose -f docker/local-net/docker-compose.yml config

ci: fmt check clippy test formal fuzz-reentrancy docker-config
