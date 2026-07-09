import { Client } from "@stellar/stellar-sdk/contract"

type ContractModule = {
	default: Client
}

export type ContractMap = Record<string, ContractModule>

export type Contracts = {
	loaded: ContractMap
	failed: Record<string, string>
	contractNames: string[]
}

/**
 * Assemble the `Contracts` result shared by every loader. Callers guarantee a
 * name lands in `loaded` or `failed` but never both, so the names need no
 * deduping — they are used as React keys.
 */
export const toContracts = (
	loaded: ContractMap,
	failed: Record<string, string>,
): Contracts => ({
	loaded,
	failed,
	contractNames: [...Object.keys(loaded), ...Object.keys(failed)],
})

const isContractModule = (module: unknown): module is ContractModule => {
	return (
		typeof module === "object" &&
		module !== null &&
		"default" in module &&
		module.default instanceof Client
	)
}

/**
 * Load contracts from files
 *
 * @example
 * ```typescript
 * const modules = import.meta.glob("../contracts/*.ts")
 * const contracts = await loadContracts(modules)
 *
 * <ContractExplorer contracts={contracts} />
 * ```
 */
export const loadContracts = async (
	contractModules: Record<string, unknown>,
): Promise<Contracts> => {
	const loaded: ContractMap = {}
	const failed: Record<string, string> = {}
	/** filename -> the module path that claimed it, to detect collisions */
	const claimedBy: Record<string, string> = {}

	for (const [path, importFn] of Object.entries(contractModules)) {
		const filename = path.split("/").pop()?.replace(".ts", "") || ""

		// TODO: remove util.ts from contract module directory for ease of loading
		if (filename === "util") continue

		// Contracts are normally a single flat directory, but a recursive glob or a
		// hand-built module map can yield two paths with the same basename. Report
		// that rather than letting the later module silently overwrite the earlier.
		const claimed = claimedBy[filename]
		if (claimed) {
			delete loaded[filename]
			failed[filename] =
				`Duplicate contract name, defined by both ${claimed} and ${path}`
			continue
		}
		claimedBy[filename] = path

		try {
			if (!(importFn instanceof Function))
				throw new Error("Invalid import function")

			const module = await importFn()

			if (!isContractModule(module)) throw new Error("Invalid contract module")

			loaded[filename] = module
		} catch (error) {
			failed[filename] = error instanceof Error ? error.message : String(error)
		}
	}

	return toContracts(loaded, failed)
}
