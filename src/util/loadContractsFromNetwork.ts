import { Client } from "@stellar/stellar-sdk/contract"
import type { ContractMap, Contracts } from "./loadContracts"
import type { Network } from "../types/types"

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

	for (const [name, contractId] of Object.entries(contractEntries)) {
		try {
			const client = await Client.from({
				contractId,
				rpcUrl: network.rpcUrl,
				networkPassphrase: network.passphrase,
				allowHttp: network.rpcUrl.startsWith("http://"),
			})
			loaded[name] = { default: client }
		} catch (error) {
			failed[name] = error instanceof Error ? error.message : String(error)
		}
	}

	const contractNames = [...Object.keys(loaded), ...Object.keys(failed)]
	return { loaded, failed, contractNames }
}
