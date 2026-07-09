/**
 * Ensures a local Stellar node is available for the E2E suite.
 *
 * Reuses an already-running node when it is new enough, and otherwise starts
 * one — stopping only the container it started. A developer's own node is never
 * torn down, because doing so would wipe any contracts they have deployed.
 */
import { execFileSync, spawnSync } from "child_process"

const RPC_URL = "http://localhost:8000/rpc"
const FRIENDBOT_URL = "http://localhost:8000/friendbot"

/**
 * Minimum protocol supported by test fixture contract
 * see: tests/fixtures/counter-contract/Cargo.toml soroban-sdk version
 */
const MIN_PROTOCOL = 27

const START_CMD = `stellar container start local --protocol-version ${MIN_PROTOCOL}`

let startedByUs = false

async function rpc<T>(method: string): Promise<T | null> {
	try {
		const res = await fetch(RPC_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", id: 1, method }),
		})
		if (!res.ok) return null
		const body = (await res.json()) as { result?: T }
		return body.result ?? null
	} catch {
		return null
	}
}

const getProtocolVersion = () =>
	rpc<{ protocolVersion: number }>("getNetwork").then(
		(r) => r?.protocolVersion ?? null,
	)

/**
 * Wait on friendbot rather than `getHealth`: RPC reports healthy before
 * friendbot can fund an account, so the tests' `keys generate --fund` races the
 * node's startup. Friendbot answering guarantees RPC is up too.
 *
 * A bare GET (no `addr`) is a 400 once friendbot is serving, so this probes
 * readiness without burning an account.
 */
async function waitForFriendbot(timeoutMs = 180_000): Promise<void> {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		try {
			const res = await fetch(FRIENDBOT_URL)
			if (res.status < 500) return
		} catch {
			// not listening yet
		}
		await new Promise((r) => setTimeout(r, 1000))
	}
	throw new Error(`friendbot was not ready within ${timeoutMs}ms`)
}

/**
 * Whether anything is serving on the node's port. Deliberately not a check of
 * RPC readiness: a node that is up but still booting answers here while
 * `getNetwork` still returns nothing, and treating that as "no node" would try
 * to start a second container over the running one.
 */
async function isNodeListening(): Promise<boolean> {
	try {
		await fetch(FRIENDBOT_URL)
		return true
	} catch {
		return false
	}
}

export async function setup() {
	if (!(await isNodeListening())) {
		console.log(`Starting local Stellar node: ${START_CMD}`)
		execFileSync(
			"stellar",
			[
				"container",
				"start",
				"local",
				"--protocol-version",
				String(MIN_PROTOCOL),
			],
			{ stdio: "inherit" },
		)
		startedByUs = true
	}

	// a node we did not start may still be booting
	await waitForFriendbot()

	const protocol = await getProtocolVersion()
	if (protocol !== null && protocol < MIN_PROTOCOL) {
		throw new Error(
			`The local Stellar node is running protocol ${protocol}, but the E2E ` +
				`tests need protocol ${MIN_PROTOCOL} or newer.\n` +
				`Restart it yourself (this wipes its ledger):\n` +
				`  stellar container stop local && ${START_CMD}`,
		)
	}
}

export function teardown() {
	if (!startedByUs) return
	console.log("Stopping the local Stellar node this run started")
	spawnSync("stellar", ["container", "stop", "local"], { stdio: "inherit" })
}
