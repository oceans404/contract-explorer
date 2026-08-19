import { Client } from "@stellar/stellar-sdk/contract"
import { type Network } from "../types/types"
import { allowHttp } from "./allowHttp"
import { errorMessage } from "./errorMessage"
import { type ContractMap, type Contracts, toContracts } from "./loadContracts"

/**
 * Load contracts from the network by fetching their specs via RPC.
 * Alternative to `loadContracts` for use outside of a Vite/bundler context.
 *
 * @example
 * ```typescript
 * const contracts = await loadContractsFromNetwork(
 *   { token: "CXXX", nft: "CYYY" },
 *   network,
 * )
 * <ContractExplorer contracts={contracts} network={network} />
 * ```
 */
export const loadContractsFromNetwork = async (
	contractEntries: Record<string, string>,
	network: Network,
): Promise<Contracts> => {
	const loaded: ContractMap = {}
	const failed: Record<string, string> = {}

	// Each spec fetch is an independent RPC round trip, so run them concurrently.
	// Results are applied in entry order, keeping `contractNames` deterministic.
	const entries = Object.entries(contractEntries)
	const results = await Promise.allSettled(
		entries.map(([, contractId]) =>
			Client.from({
				contractId,
				rpcUrl: network.rpcUrl,
				networkPassphrase: network.passphrase,
				allowHttp: allowHttp(network.rpcUrl),
			}),
		),
	)

	entries.forEach(([name], i) => {
		const result = results[i]
		if (result.status === "fulfilled") {
			loaded[name] = { default: result.value }
		} else {
			const error: unknown = result.reason
			failed[name] = errorMessage(error)
		}
	})

	return toContracts(loaded, failed)
}
