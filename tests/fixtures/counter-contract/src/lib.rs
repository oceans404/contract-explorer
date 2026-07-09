//! Minimal counter contract, built to `tests/fixtures/counter.wasm` and
//! deployed by the E2E tests so they can load a real spec over RPC.
//!
//! The interface must stay in sync with `tests/fixtures/counter.ts`, which
//! declares the same two functions as offline XDR spec entries.
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

const COUNT: Symbol = symbol_short!("COUNT");

#[contract]
pub struct Counter;

#[contractimpl]
impl Counter {
    /// Increment the counter by the given amount
    pub fn increment(env: Env, by: u32) -> u32 {
        let count: u32 = env.storage().instance().get(&COUNT).unwrap_or(0);
        let count = count + by;
        env.storage().instance().set(&COUNT, &count);
        count
    }

    /// Return the current counter value
    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&COUNT).unwrap_or(0)
    }
}
