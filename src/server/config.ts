import { Networks } from "@stellar/stellar-sdk"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { type Network, type NetworkType } from "../types/types"

const KNOWN_NETWORKS: Record<NetworkType, Network> = {
	local: {
		id: "local",
		label: "Local",
		rpcUrl: "http://localhost:8000/rpc",
		horizonUrl: "http://localhost:8000",
		passphrase: Networks.STANDALONE,
	},
	testnet: {
		id: "testnet",
		label: "Testnet",
		rpcUrl: "https://soroban-testnet.stellar.org",
		horizonUrl: "https://horizon-testnet.stellar.org",
		passphrase: Networks.TESTNET,
	},
	mainnet: {
		id: "mainnet",
		label: "Mainnet",
		rpcUrl: "https://rpc.stellar.org",
		horizonUrl: "https://horizon.stellar.org",
		passphrase: Networks.PUBLIC,
	},
	futurenet: {
		id: "futurenet",
		label: "Futurenet",
		rpcUrl: "https://rpc-futurenet.stellar.org",
		horizonUrl: "https://horizon-futurenet.stellar.org",
		passphrase: Networks.FUTURENET,
	},
}

const NETWORK_NAMES = Object.keys(KNOWN_NETWORKS) as NetworkType[]

const isNetworkType = (name: string): name is NetworkType =>
	Object.prototype.hasOwnProperty.call(KNOWN_NETWORKS, name)

function fail(message: string): never {
	console.error(message)
	process.exit(1)
}

/**
 * Parse a `--port` value. Rejects NaN and out-of-range values, which would
 * otherwise surface as an ERR_SOCKET_BAD_PORT crash inside `server.listen`.
 */
function parsePort(value: string): number {
	const port = Number(value)
	if (!Number.isInteger(port) || port < 0 || port > 65535) {
		fail(`Error: invalid --port "${value}". Expected an integer 0-65535.`)
	}
	return port
}

/** Parse a `--contract name:CONTRACT_ID` value. */
function parseContract(value: string): [string, string] {
	const sep = value.indexOf(":")
	const name = value.slice(0, sep)
	const contractId = value.slice(sep + 1)
	if (sep <= 0 || !contractId) {
		fail(
			`Error: invalid --contract "${value}".\n` +
				"  Expected name:CONTRACT_ID, e.g. --contract token:CXXX",
		)
	}
	return [name, contractId]
}

export type ServerConfig = {
	contracts: Record<string, string>
	network: Network
	port: number
}

type ConfigFile = {
	network?: string
	rpcUrl?: string
	horizonUrl?: string
	passphrase?: string
	contracts?: Record<string, string>
	port?: number
}

export function resolveConfig(): ServerConfig {
	const args = process.argv.slice(2)

	const cliContracts: Record<string, string> = {}
	let cliNetwork: string | undefined
	let cliRpcUrl: string | undefined
	let cliHorizonUrl: string | undefined
	let cliPassphrase: string | undefined
	let cliPort: number | undefined

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		const next = args[i + 1]

		if (arg === "--contract" && next) {
			const [name, contractId] = parseContract(next)
			cliContracts[name] = contractId
			i++
		} else if (arg === "--network" && next) {
			cliNetwork = next
			i++
		} else if (arg === "--rpc-url" && next) {
			cliRpcUrl = next
			i++
		} else if (arg === "--horizon-url" && next) {
			cliHorizonUrl = next
			i++
		} else if (arg === "--passphrase" && next) {
			cliPassphrase = next
			i++
		} else if (arg === "--port" && next) {
			cliPort = parsePort(next)
			i++
		}
	}

	// Read config file (CLI args override)
	const configPath = resolve(process.cwd(), "contract-explorer.json")
	let fileConfig: ConfigFile = {}
	if (existsSync(configPath)) {
		try {
			fileConfig = JSON.parse(readFileSync(configPath, "utf8")) as ConfigFile
		} catch {
			console.warn("Warning: could not parse contract-explorer.json")
		}
	}

	const networkName = cliNetwork ?? fileConfig.network ?? "local"
	const contracts =
		Object.keys(cliContracts).length > 0
			? cliContracts
			: (fileConfig.contracts ?? {})
	const port = cliPort ?? fileConfig.port ?? 4000

	if (!isNetworkType(networkName)) {
		fail(
			`Error: unknown network "${networkName}".\n` +
				`  Expected one of: ${NETWORK_NAMES.join(", ")}\n` +
				"  Override individual endpoints with --rpc-url / --horizon-url / --passphrase.",
		)
	}
	const baseNetwork = KNOWN_NETWORKS[networkName]

	const network: Network = {
		...baseNetwork,
		rpcUrl: cliRpcUrl ?? fileConfig.rpcUrl ?? baseNetwork.rpcUrl,
		horizonUrl: cliHorizonUrl ?? fileConfig.horizonUrl ?? baseNetwork.horizonUrl,
		passphrase: cliPassphrase ?? fileConfig.passphrase ?? baseNetwork.passphrase,
	}

	if (Object.keys(contracts).length === 0) {
		fail(
			"Error: no contracts specified.\n" +
				"  Use --contract name:CONTRACT_ID, or add a contract-explorer.json file.\n" +
				"  Example: npx contract-explorer --contract token:CXXX --contract nft:CYYY",
		)
	}

	return { contracts, network, port }
}
