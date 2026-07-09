import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ContractExplorer } from "../../src/components/ContractExplorer"
import { type Network } from "../../src/types/types"
import { type Contracts } from "../../src/util/loadContracts"
import counterClient from "../fixtures/counter"

const network: Network = {
	id: "local",
	label: "Local",
	rpcUrl: "http://localhost:8000/rpc",
	horizonUrl: "http://localhost:8000",
	passphrase: "Standalone Network ; February 2017",
}

const contracts: Contracts = {
	loaded: { counter: { default: counterClient } },
	failed: {},
	contractNames: ["counter"],
}

function Wrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={new QueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

describe("ContractExplorer", () => {
	it("renders the contract name in the selector", () => {
		render(<ContractExplorer contracts={contracts} network={network} />, {
			wrapper: Wrapper,
		})
		expect(screen.getByRole("button", { name: "counter" })).toBeInTheDocument()
	})

	it("renders the contract functions", () => {
		render(<ContractExplorer contracts={contracts} network={network} />, {
			wrapper: Wrapper,
		})
		expect(screen.getByText("increment")).toBeInTheDocument()
		expect(screen.getByText("get_count")).toBeInTheDocument()
	})

	it("shows only the failure reason for a contract that failed to load", () => {
		const withFailure: Contracts = {
			loaded: {},
			failed: { counter: "Invalid contract module" },
			contractNames: ["counter"],
		}
		render(<ContractExplorer contracts={withFailure} network={network} />, {
			wrapper: Wrapper,
		})
		expect(screen.getByText(/invalid contract module/i)).toBeInTheDocument()
		// a contract IS selected, so the old "no contract selected" copy must not appear
		expect(screen.queryByText(/no contract selected/i)).not.toBeInTheDocument()
	})

	it("renders a message when no contracts are loaded", () => {
		const empty: Contracts = { loaded: {}, failed: {}, contractNames: [] }
		render(<ContractExplorer contracts={empty} network={network} />, {
			wrapper: Wrapper,
		})
		expect(screen.getByText(/no contracts found/i)).toBeInTheDocument()
	})
})
