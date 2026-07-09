# counter-contract

Source for `tests/fixtures/counter.wasm`, the contract the E2E tests deploy to a
local network so they can load a real spec over RPC.

Its interface is kept in sync with `tests/fixtures/counter.ts`, which declares
the same two functions as offline XDR spec entries for the unit tests.

## Rebuilding

The `.wasm` is checked in so the test suite needs no Rust toolchain. Rebuild it
only when the interface changes:

```bash
cd tests/fixtures/counter-contract
stellar contract build --out-dir /tmp/cbuild
cp /tmp/cbuild/counter_contract.wasm ../counter.wasm
```

Requires the `wasm32v1-none` target (`rustup target add wasm32v1-none`).
