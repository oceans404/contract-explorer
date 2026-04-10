import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import type { Network, NetworkType } from "../types/types"

const KNOWN_NETWORKS: Record<string, Network> = {
	local: {
		id: "local",
		label: "Local",
		rpcUrl: "http://localhost:8000/rpc",
		horizonUrl: "http://localhost:8000",
		passphrase: "Standalone Network ; February 2017",
	},
	testnet: {
		id: "testnet",
		label: "Testnet",
		rpcUrl: "https://soroban-testnet.stellar.org",
		horizonUrl: "https://horizon-testnet.stellar.org",
		passphrase: "Test SDF Network ; September 2015",
	},
	mainnet: {
		id: "mainnet",
		label: "Mainnet",
		rpcUrl: "https://rpc.stellar.org",
		horizonUrl: "https://horizon.stellar.org",
		passphrase: "Public Global Stellar Network ; September 2015",
	},
	futurenet: {
		id: "futurenet",
		label: "Futurenet",
		rpcUrl: "https://rpc-futurenet.stellar.org",
		horizonUrl: "https://horizon-futurenet.stellar.org",
		passphrase: "Test SDF Future Network ; October 2022",
	},
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
			const sep = next.indexOf(":")
			if (sep > 0) {
				cliContracts[next.slice(0, sep)] = next.slice(sep + 1)
			}
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
			cliPort = parseInt(next, 10)
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

	const baseNetwork = KNOWN_NETWORKS[networkName] ?? {
		...KNOWN_NETWORKS.local,
		id: networkName as NetworkType,
		label: networkName,
	}

	const network: Network = {
		...baseNetwork,
		...(cliRpcUrl || fileConfig.rpcUrl
			? { rpcUrl: cliRpcUrl ?? fileConfig.rpcUrl! }
			: {}),
		...(cliHorizonUrl || fileConfig.horizonUrl
			? { horizonUrl: cliHorizonUrl ?? fileConfig.horizonUrl! }
			: {}),
		...(cliPassphrase || fileConfig.passphrase
			? { passphrase: cliPassphrase ?? fileConfig.passphrase! }
			: {}),
	}

	if (Object.keys(contracts).length === 0) {
		console.error(
			"Error: no contracts specified.\n" +
				"  Use --contract name:CONTRACT_ID, or add a contract-explorer.json file.\n" +
				"  Example: npx contract-explorer --contract token:CXXX --contract nft:CYYY",
		)
		process.exit(1)
	}

	return { contracts, network, port }
}
