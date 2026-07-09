import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { createRoot } from "react-dom/client"
import { ContractExplorer } from "../components/ContractExplorer"
import { type Network } from "../types/types"
import { type Contracts } from "../util/loadContracts"
import { loadContractsFromNetwork } from "../util/loadContractsFromNetwork"

const queryClient = new QueryClient()

type AppConfig = {
	contracts: Record<string, string>
	network: Network
}

function App() {
	const [config, setConfig] = React.useState<AppConfig | null>(null)
	const [contracts, setContracts] = React.useState<Contracts | null>(null)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		fetch("/api/config")
			.then((res) => {
				if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`)
				return res.json() as Promise<AppConfig>
			})
			.then(async (cfg) => {
				setConfig(cfg)
				const loaded = await loadContractsFromNetwork(
					cfg.contracts,
					cfg.network,
				)
				setContracts(loaded)
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : "Failed to load config")
			})
	}, [])

	if (error) {
		return (
			<div style={{ padding: "2rem", fontFamily: "monospace" }}>
				<h2 style={{ color: "var(--color-error, red)" }}>
					Error loading contracts
				</h2>
				<p>{error}</p>
			</div>
		)
	}

	if (!config || !contracts) {
		return (
			<div style={{ padding: "2rem", fontFamily: "monospace" }}>
				<p>Loading contracts…</p>
			</div>
		)
	}

	return (
		<QueryClientProvider client={queryClient}>
			<ContractExplorer contracts={contracts} network={config.network} />
		</QueryClientProvider>
	)
}

const rootEl = document.getElementById("root")
if (rootEl) {
	createRoot(rootEl).render(<App />)
}
