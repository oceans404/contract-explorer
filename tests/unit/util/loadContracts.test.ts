import { describe, it, expect } from "vitest"
import { loadContracts } from "../../../src/util/loadContracts"
import { Client } from "@stellar/stellar-sdk/contract"
import counterClient from "../../fixtures/counter"

describe("loadContracts", () => {
	it("loads valid contract modules", async () => {
		const modules = {
			"../contracts/counter.ts": async () => ({ default: counterClient }),
		}
		const result = await loadContracts(modules)
		expect(result.loaded.counter).toBeDefined()
		expect(result.loaded.counter.default).toBeInstanceOf(Client)
		expect(result.contractNames).toContain("counter")
		expect(result.failed).toEqual({})
	})

	it("records modules that fail to load", async () => {
		const modules = {
			"../contracts/broken.ts": async () => {
				throw new Error("module not found")
			},
		}
		const result = await loadContracts(modules)
		expect(result.failed.broken).toMatch("module not found")
		expect(result.loaded).toEqual({})
		expect(result.contractNames).toContain("broken")
	})

	it("records modules that export the wrong shape", async () => {
		const modules = {
			"../contracts/bad.ts": async () => ({ default: "not a client" }),
		}
		const result = await loadContracts(modules)
		expect(result.failed.bad).toBeDefined()
	})

	it("skips util.ts files", async () => {
		const modules = {
			"../contracts/util.ts": async () => ({ default: counterClient }),
		}
		const result = await loadContracts(modules)
		expect(result.contractNames).not.toContain("util")
	})

	it("handles a mix of loaded and failed modules", async () => {
		const modules = {
			"../contracts/counter.ts": async () => ({ default: counterClient }),
			"../contracts/broken.ts": async () => {
				throw new Error("oops")
			},
		}
		const result = await loadContracts(modules)
		expect(result.loaded.counter).toBeDefined()
		expect(result.failed.broken).toBeDefined()
		expect(result.contractNames).toHaveLength(2)
	})
})
