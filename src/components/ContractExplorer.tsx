import { Layout, Code, Card, Button, Input } from "@stellar/design-system"
import * as React from "react"
import { CEContext, getLabUrl } from "../context"
import { type Network, type SignTransactionFn } from "../types/types"
import { type Contracts } from "../util/loadContracts"
import { Box } from "./Box"
import { ContractForm } from "./ContractForm"
import RenderContractMetadata from "./RenderContractMetadata"

export type ContractExplorerProps = {
	/**
	 * User's wallet address if connected
	 */
	address?: string
	/**
	 * Loaded contracts from `loadContracts()`
	 */
	contracts: Contracts
	network: Network
	signTransaction?: SignTransactionFn
}

export function ContractExplorer({
	address,
	contracts,
	network,
	signTransaction,
}: ContractExplorerProps) {
	const value = React.useMemo(
		() => ({
			address,
			network,
			signTransaction,
			labUrl: getLabUrl(network),
		}),
		[address, network, signTransaction],
	)

	const [selectedContract, setSelectedContract] = React.useState<string | null>(
		null,
	)

	const [isDetailExpanded, setIsDetailExpanded] = React.useState(false)

	// Select first contract once they're loaded
	React.useEffect(() => {
		if (!selectedContract && contracts?.contractNames[0]) {
			setSelectedContract(contracts.contractNames[0])
		}
	}, [selectedContract, contracts, setSelectedContract])

	if (contracts.contractNames.length === 0) {
		return (
			<Layout.Content>
				<Layout.Inset>
					<p>No contracts found in src/contracts/</p>
					<p>
						Do you have any contracts defined in your root{" "}
						<Code size="sm">contracts</Code> folder, and defined in your
						environments.toml file?
					</p>
					<p>
						Use <Code size="sm">stellar scaffold generate contract</Code> to
						install contracts from the{" "}
						<a href="https://github.com/OpenZeppelin/stellar-contracts">
							OpenZeppelin Stellar Contracts
						</a>{" "}
						repository, or visit the{" "}
						<a href="https://wizard.openzeppelin.com/stellar">
							OpenZeppelin Wizard
						</a>{" "}
						to interactively build your contract.
					</p>
				</Layout.Inset>
			</Layout.Content>
		)
	}

	if (!selectedContract) {
		return (
			<Layout.Content>
				<Layout.Inset>
					<p>Loading contracts...</p>
				</Layout.Inset>
			</Layout.Content>
		)
	}

	const contract = contracts.loaded[selectedContract]
	const isFailed = !contract && contracts.failed[selectedContract]

	return (
		<CEContext.Provider value={value}>
			<Layout.Content>
				{/* Contract Selector Pills */}
				<Layout.Inset>
					<div
						style={{
							display: "flex",
							alignItems: "baseline",
							gap: "0.5rem",
							marginBottom: "1rem",
							marginTop: "1rem",
							flexWrap: "wrap",
						}}
					>
						<span>Select Contract:</span>
						{contracts.contractNames.map((key) => (
							<Button
								key={key}
								onClick={() => setSelectedContract(key)}
								variant={key === selectedContract ? "primary" : "tertiary"}
								size="sm"
							>
								{key}
							</Button>
						))}
					</div>
				</Layout.Inset>

				{/* Show error or contract details */}
				{isFailed && contracts.failed[selectedContract] && (
					<Layout.Inset>
						<h2>{selectedContract}</h2>
						<p style={{ color: "red" }}>
							Failed to import contract: {contracts.failed[selectedContract]}
						</p>
					</Layout.Inset>
				)}

				{contract && (
					<Layout.Inset>
						<div style={{ marginTop: "0 2rem" }}>
							<div style={{ display: "flex", flexFlow: "column", gap: "1rem" }}>
								{/* Contract detail card */}
								<div
									style={{
										flexBasis: "30%",
										minWidth: "100%",
										alignSelf: "flex-start",
									}}
								>
									<Card variant="primary">
										<Box gap="md">
											<h3>{selectedContract}</h3>

											<Input
												label="Contract ID"
												id="contract-id"
												fieldSize="md"
												copyButton={{
													position: "right",
												}}
												readOnly
												value={contract.default.options.contractId}
											/>

											{isDetailExpanded && (
												<>
													<RenderContractMetadata
														contractId={contract.default.options.contractId}
													/>
												</>
											)}
										</Box>
										<Button
											variant="tertiary"
											size="sm"
											onClick={() => setIsDetailExpanded(!isDetailExpanded)}
											style={{ justifySelf: "flex-end", marginTop: "1rem" }}
										>
											{isDetailExpanded ? "Hide Details" : "Show Details"}
										</Button>
									</Card>
								</div>

								{/* Contract methods and interactions */}
								<div style={{ flex: 1 }}>
									<ContractForm
										key={selectedContract}
										contractClient={contract.default}
										contractClientError={null}
									/>
								</div>
							</div>
						</div>
					</Layout.Inset>
				)}
			</Layout.Content>
		</CEContext.Provider>
	)
}
