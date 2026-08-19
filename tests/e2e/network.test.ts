/**
 * E2E tests — require the `stellar` CLI. tests/e2e/globalSetup.ts starts a
 * local Stellar node if one is not already running.
 */
import { execFileSync } from "child_process"
import { randomBytes } from "crypto"
import { join } from "path"
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { type Network } from "../../src/types/types"
import { loadContractsFromNetwork } from "../../src/util/loadContractsFromNetwork"

const LOCAL_NETWORK: Network = {
	id: "local",
	label: "Local",
	rpcUrl: "http://localhost:8000/rpc",
	horizonUrl: "http://localhost:8000",
	passphrase: "Standalone Network ; February 2017",
}

/** Built from tests/fixtures/counter-contract — see that crate's README. */
const COUNTER_WASM = join(__dirname, "../fixtures/counter.wasm")

/** A SAC has no Wasm, so its spec can never be fetched by `Client.from`. */
const SAC_LIKE_BUT_UNDEPLOYED =
	"CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

const identity = `e2e-${randomBytes(4).toString("hex")}`
let counterId: string

const stellar = (...args: string[]): string =>
	execFileSync("stellar", args, {
		encoding: "utf8",
		env: {
			...process.env,
			STELLAR_RPC_URL: LOCAL_NETWORK.rpcUrl,
			STELLAR_NETWORK_PASSPHRASE: LOCAL_NETWORK.passphrase,
		},
	}).trim()

describe("loadContractsFromNetwork (E2E, local network)", () => {
	beforeAll(() => {
		// A fresh container has an empty ledger, so deploy the fixture each run
		// rather than assuming any contract already exists on chain.
		stellar("keys", "generate", identity, "--fund")
		counterId = stellar(
			"contract",
			"deploy",
			"--wasm",
			COUNTER_WASM,
			"--source-account",
			identity,
		)
			.split("\n")
			.pop()!
	})

	afterAll(() => {
		try {
			stellar("keys", "rm", identity, "--force")
		} catch {
			// best effort — a leftover identity is harmless
		}
	})

	it("loads a deployed contract's spec from the local network", async () => {
		const result = await loadContractsFromNetwork(
			{ counter: counterId },
			LOCAL_NETWORK,
		)
		expect(result.failed).toEqual({})
		expect(result.loaded.counter).toBeDefined()
		expect(result.loaded.counter.default.options.contractId).toBe(counterId)
	})

	it("fetches the real spec, matching the offline counter fixture", async () => {
		const result = await loadContractsFromNetwork(
			{ counter: counterId },
			LOCAL_NETWORK,
		)
		const funcs = result.loaded.counter.default.spec
			.funcs()
			.map((f) => f.name().toString())
		expect(funcs.sort()).toEqual(["get_count", "increment"])
	})

	it("records a contract that does not exist on the network", async () => {
		const result = await loadContractsFromNetwork(
			{ missing: SAC_LIKE_BUT_UNDEPLOYED },
			LOCAL_NETWORK,
		)
		expect(result.loaded).toEqual({})
		// the sdk rejects with a bare {code, message}, not an Error
		expect(result.failed.missing).toMatch(/could not obtain contract hash/i)
	})
})
