// @vitest-environment node
//
// Under jsdom, vi.mock("fs") only patches the binding this test file sees —
// it doesn't propagate to fs imported by src/server/config.ts. Plain node
// env doesn't have that problem, and this file doesn't touch the DOM anyway.
import { existsSync, readFileSync } from "fs"
import type * as fs from "fs"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { resolveConfig } from "../../../src/server/config"

// vi.mock is hoisted above imports by vitest, so resolveConfig will see
// the mocked fs from the very first call
vi.mock("fs", async (importOriginal) => {
	const actual = await importOriginal<typeof fs>()
	return {
		...actual,
		existsSync: vi.fn(() => false),
		readFileSync: vi.fn(() => "{}"),
	}
})

const mockExistsSync = vi.mocked(existsSync)
const mockReadFileSync = vi.mocked(readFileSync)

const originalArgv = process.argv
const originalExit = process.exit
const originalError = console.error

/**
 * The real process.exit never returns, so resolveConfig's code after a fail()
 * is unreachable. A plain vi.fn() would let execution fall through into that
 * unreachable code; throwing keeps the mock faithful to `never`.
 */
class ProcessExit extends Error {
	constructor(readonly code?: number) {
		super(`process.exit(${code})`)
	}
}

/** Run resolveConfig expecting it to bail out via process.exit(1). */
const expectExit = (fn: () => unknown) => {
	expect(fn).toThrow(ProcessExit)
	expect(process.exit).toHaveBeenCalledWith(1)
}

beforeEach(() => {
	process.argv = ["node", "index.js"]
	mockExistsSync.mockReturnValue(false)
	process.exit = vi.fn((code?: number) => {
		throw new ProcessExit(code)
	}) as never
	console.error = vi.fn()
})

afterEach(() => {
	process.argv = originalArgv
	process.exit = originalExit
	console.error = originalError
	vi.clearAllMocks()
})

describe("resolveConfig — CLI args", () => {
	it("parses --contract name:id pairs", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"token:CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
		]
		const config = resolveConfig()
		expect(config.contracts).toEqual({
			token: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
		})
	})

	it("parses multiple --contract flags", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"token:CAAA",
			"--contract",
			"nft:CBBB",
		]
		const config = resolveConfig()
		expect(config.contracts).toEqual({ token: "CAAA", nft: "CBBB" })
	})

	it("parses --port", () => {
		process.argv = ["node", "index.js", "--contract", "t:C", "--port", "9000"]
		const config = resolveConfig()
		expect(config.port).toBe(9000)
	})

	it("defaults to port 4000", () => {
		process.argv = ["node", "index.js", "--contract", "t:C"]
		const config = resolveConfig()
		expect(config.port).toBe(4000)
	})

	it("rejects a non-numeric --port instead of listening on NaN", () => {
		process.argv = ["node", "index.js", "--contract", "t:C", "--port", "abc"]
		expectExit(resolveConfig)
	})

	it("rejects an out-of-range --port", () => {
		process.argv = ["node", "index.js", "--contract", "t:C", "--port", "99999"]
		expectExit(resolveConfig)
	})

	it("rejects an unknown --network instead of silently using local", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"t:C",
			"--network",
			"tesnet",
		]
		expectExit(resolveConfig)
	})

	it("rejects a --contract value with no colon rather than eating the next flag", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"token",
			"--network",
			"testnet",
		]
		expectExit(resolveConfig)
	})

	it("rejects a --contract value with an empty contract id", () => {
		process.argv = ["node", "index.js", "--contract", "token:"]
		expectExit(resolveConfig)
	})

	it("resolves well-known local network by default", () => {
		process.argv = ["node", "index.js", "--contract", "t:C"]
		const config = resolveConfig()
		expect(config.network.id).toBe("local")
		expect(config.network.rpcUrl).toBe("http://localhost:8000/rpc")
		expect(config.network.passphrase).toBe("Standalone Network ; February 2017")
	})

	it("resolves well-known testnet", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"t:C",
			"--network",
			"testnet",
		]
		const config = resolveConfig()
		expect(config.network.id).toBe("testnet")
		expect(config.network.rpcUrl).toBe("https://soroban-testnet.stellar.org")
	})

	it("overrides rpcUrl and passphrase with custom flags", () => {
		process.argv = [
			"node",
			"index.js",
			"--contract",
			"t:C",
			"--rpc-url",
			"http://custom:9000/rpc",
			"--passphrase",
			"My Network",
		]
		const config = resolveConfig()
		expect(config.network.rpcUrl).toBe("http://custom:9000/rpc")
		expect(config.network.passphrase).toBe("My Network")
	})

	it("calls process.exit(1) when no contracts are provided", () => {
		process.argv = ["node", "index.js"]
		expectExit(resolveConfig)
	})
})

describe("resolveConfig — config file", () => {
	it("reads contracts from contract-explorer.json", () => {
		mockExistsSync.mockReturnValue(true)
		mockReadFileSync.mockReturnValue(
			JSON.stringify({ contracts: { token: "CXXX" } }),
		)
		const config = resolveConfig()
		expect(config.contracts).toEqual({ token: "CXXX" })
	})

	it("CLI --contract args override the config file", () => {
		mockExistsSync.mockReturnValue(true)
		mockReadFileSync.mockReturnValue(
			JSON.stringify({ contracts: { token: "CFILE" } }),
		)
		process.argv = ["node", "index.js", "--contract", "token:CCLI"]
		const config = resolveConfig()
		expect(config.contracts).toEqual({ token: "CCLI" })
	})

	it("reads port from config file", () => {
		mockExistsSync.mockReturnValue(true)
		mockReadFileSync.mockReturnValue(
			JSON.stringify({ contracts: { token: "CXXX" }, port: 5000 }),
		)
		const config = resolveConfig()
		expect(config.port).toBe(5000)
	})
})
