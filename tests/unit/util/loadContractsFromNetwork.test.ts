import { Client } from "@stellar/stellar-sdk/contract"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { loadContractsFromNetwork } from "../../../src/util/loadContractsFromNetwork"
import counterClient from "../../fixtures/counter"

const mockFrom = vi.spyOn(Client, "from")

const localNetwork = {
	id: "local" as const,
	label: "Local",
	rpcUrl: "http://localhost:8000/rpc",
	horizonUrl: "http://localhost:8000",
	passphrase: "Standalone Network ; February 2017",
}

beforeEach(() => {
	mockFrom.mockResolvedValue(counterClient)
})

afterEach(() => {
	vi.clearAllMocks()
})

describe("loadContractsFromNetwork", () => {
	it("returns loaded clients keyed by name", async () => {
		const result = await loadContractsFromNetwork(
			{ counter: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM" },
			localNetwork,
		)
		expect(result.loaded.counter.default).toBe(counterClient)
		expect(result.failed).toEqual({})
		expect(result.contractNames).toContain("counter")
	})

	it("calls Client.from with correct options", async () => {
		const contractId =
			"CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
		await loadContractsFromNetwork({ counter: contractId }, localNetwork)
		expect(mockFrom).toHaveBeenCalledWith({
			contractId,
			rpcUrl: localNetwork.rpcUrl,
			networkPassphrase: localNetwork.passphrase,
			allowHttp: true,
		})
	})

	it("sets allowHttp: false for https RPC URLs", async () => {
		const httpsNetwork = {
			...localNetwork,
			rpcUrl: "https://soroban-testnet.stellar.org",
		}
		await loadContractsFromNetwork({ counter: "CXXX" }, httpsNetwork)
		expect(mockFrom).toHaveBeenCalledWith(
			expect.objectContaining({ allowHttp: false }),
		)
	})

	it("records contracts that fail to load", async () => {
		mockFrom.mockRejectedValueOnce(new Error("contract not found"))
		const result = await loadContractsFromNetwork(
			{ broken: "CXXX" },
			localNetwork,
		)
		expect(result.failed.broken).toMatch("contract not found")
		expect(result.loaded).toEqual({})
	})

	it("handles a mix of loaded and failed contracts", async () => {
		mockFrom
			.mockResolvedValueOnce(counterClient)
			.mockRejectedValueOnce(new Error("not deployed"))
		const result = await loadContractsFromNetwork(
			{ counter: "CAAA", broken: "CBBB" },
			localNetwork,
		)
		expect(result.loaded.counter).toBeDefined()
		expect(result.failed.broken).toBeDefined()
	})
})
