/**
 * E2E tests — require a running local Stellar network.
 * Start one with: stellar network start local
 */
import { Asset } from "@stellar/stellar-sdk"
import { describe, it, expect, beforeAll } from "vitest"
import { type Network } from "../../src/types/types"
import { loadContractsFromNetwork } from "../../src/util/loadContractsFromNetwork"

const LOCAL_NETWORK: Network = {
	id: "local",
	label: "Local",
	rpcUrl: "http://localhost:8000/rpc",
	horizonUrl: "http://localhost:8000",
	passphrase: "Standalone Network ; February 2017",
}

// The native XLM SAC is always deployed on any Stellar network
const XLM_CONTRACT_ID = Asset.native().contractId(LOCAL_NETWORK.passphrase)

async function isNetworkReachable(): Promise<boolean> {
	try {
		const res = await fetch(LOCAL_NETWORK.rpcUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
		})
		return res.ok
	} catch {
		return false
	}
}

describe("loadContractsFromNetwork (E2E, local network)", () => {
	beforeAll(async () => {
		const reachable = await isNetworkReachable()
		if (!reachable) {
			throw new Error(
				"Local Stellar network is not running.\n" +
					"Start it with: stellar network start local",
			)
		}
	})

	it("loads the native XLM SAC contract from the local network", async () => {
		const result = await loadContractsFromNetwork(
			{ xlm: XLM_CONTRACT_ID },
			LOCAL_NETWORK,
		)
		expect(result.loaded.xlm).toBeDefined()
		expect(result.loaded.xlm.default.options.contractId).toBe(XLM_CONTRACT_ID)
		expect(result.failed).toEqual({})
	})

	it("records a contract that does not exist on the network", async () => {
		const result = await loadContractsFromNetwork(
			{ missing: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM" },
			LOCAL_NETWORK,
		)
		expect(result.failed.missing).toBeDefined()
		expect(result.loaded).toEqual({})
	})
})
