/**
 * E2E tests for the dev server — require a running local Stellar network.
 * Start one with: stellar network start local
 *
 * These tests spawn the compiled server binary and hit its HTTP endpoints.
 * Run `npm run build` before running these tests.
 */
import { spawn, type ChildProcess } from "child_process"
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { Asset } from "@stellar/stellar-sdk"
import { describe, it, expect, beforeAll, afterAll } from "vitest"

const PORT = 4099
const BASE_URL = `http://localhost:${PORT}`
const PASSPHRASE = "Standalone Network ; February 2017"
const XLM_CONTRACT_ID = Asset.native().contractId(PASSPHRASE)
const SERVER_BIN = join(process.cwd(), "dist/server/index.cjs")

let serverProcess: ChildProcess
/**
 * resolveConfig reads ./contract-explorer.json from the process cwd, and
 * developers are told to create one at the repo root. Spawn the server in an
 * empty directory so these assertions test the CLI flags, not the local file.
 */
let emptyCwd: string

async function waitForServer(retries = 20): Promise<void> {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(`${BASE_URL}/api/config`)
			if (res.ok) return
		} catch {
			// not ready yet
		}
		await new Promise((r) => setTimeout(r, 200))
	}
	throw new Error("Server did not start in time")
}

beforeAll(async () => {
	emptyCwd = mkdtempSync(join(tmpdir(), "contract-explorer-e2e-"))
	serverProcess = spawn(
		"node",
		[
			SERVER_BIN,
			"--contract",
			`xlm:${XLM_CONTRACT_ID}`,
			"--network",
			"local",
			"--port",
			String(PORT),
		],
		{ stdio: "pipe", cwd: emptyCwd },
	)
	await waitForServer()
})

afterAll(() => {
	serverProcess?.kill()
	if (emptyCwd) rmSync(emptyCwd, { recursive: true, force: true })
})

describe("dev server (E2E)", () => {
	it("GET /api/config returns the configured contracts and network", async () => {
		const res = await fetch(`${BASE_URL}/api/config`)
		expect(res.ok).toBe(true)
		const body = await res.json()
		expect(body.contracts).toEqual({ xlm: XLM_CONTRACT_ID })
		expect(body.network.id).toBe("local")
		expect(body.network.rpcUrl).toBe("http://localhost:8000/rpc")
	})

	it("GET / returns an HTML page", async () => {
		const res = await fetch(BASE_URL)
		expect(res.ok).toBe(true)
		expect(res.headers.get("content-type")).toMatch("text/html")
		const html = await res.text()
		expect(html).toContain('<div id="root">')
	})

	it("GET /app.js returns JavaScript", async () => {
		const res = await fetch(`${BASE_URL}/app.js`)
		expect(res.ok).toBe(true)
		expect(res.headers.get("content-type")).toMatch("application/javascript")
	})
})
