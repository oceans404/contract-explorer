import { useState, useEffect } from "react"
import { Alert } from "@stellar/design-system"
import { type SubmitRpcResponse } from "../types/types"
import { initialize, decode } from "../util/StellarXdr"
import { Box } from "./Box"
import { TxResponse } from "./TxResponse"
import { ValidationResponseCard } from "./ValidationResponseCard"

import { XdrJsonViewer } from "./XdrJsonViewer"

interface TransactionSuccessCardProps {
	response: SubmitRpcResponse
}

export const TransactionSuccessCard = ({
	response,
}: TransactionSuccessCardProps) => {
	const [returnValue, setReturnValue] = useState<unknown>(null)

	useEffect(() => {
		let cancelled = false

		const decodeReturnValue = async () => {
			try {
				const rv = response.result.returnValue
				if (rv == null) return

				const rvXdr = rv.toXDR("base64")
				await initialize()
				const rvJson = JSON.parse(decode("ScVal", rvXdr))

				if (cancelled) return
				if (JSON.stringify(rvJson) !== '"void"') {
					setReturnValue(rvJson)
				}
			} catch (error) {
				console.error("Failed to decode return value:", error)
			}
		}

		decodeReturnValue()

		return () => {
			cancelled = true
		}
	}, [response])

	return (
		<ValidationResponseCard
			variant="success"
			title="Transaction submitted!"
			summary={
				<>
					<Alert
						variant="success"
						placement="inline"
						title="Successful Execution"
					>
						{" "}
						{`Transaction succeeded with ${response.operationCount} operation(s)`}
					</Alert>
					{returnValue !== null && (
						<div
							style={{
								margin: "0.75rem 0",
								padding: "0.75rem 1rem",
								backgroundColor: "var(--sds-clr-gray-03)",
								borderRadius: "0.5rem",
								border: "1px solid var(--sds-clr-green-06)",
							}}
						>
							<strong>Return Value:</strong>
							<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
								{JSON.stringify(returnValue, null, 2)}
							</pre>
						</div>
					)}
				</>
			}
			note={<></>}
			detailedResponse={
				<Box gap="lg">
					<TxResponse
						data-testid="submit-tx-rpc-success-hash"
						label="Hash:"
						value={response.hash}
					/>

					<TxResponse
						data-testid="submit-tx-rpc-success-ledger"
						label="Ledger number:"
						value={response.result.ledger.toString()}
					/>
					<TxResponse
						data-testid="submit-tx-rpc-success-envelope-xdr"
						label="Transaction Envelope:"
						item={
							<XdrJsonViewer
								xdr={response.result.envelopeXdr.toXDR("base64").toString()}
								typeVariant="TransactionEnvelope"
							/>
						}
					/>

					<TxResponse
						data-testid="submit-tx-rpc-success-result-xdr"
						label="Transaction Result:"
						item={
							<XdrJsonViewer
								xdr={response.result.resultXdr.toXDR("base64").toString()}
								typeVariant="TransactionResult"
							/>
						}
					/>
					<TxResponse
						data-testid="submit-tx-rpc-success-result-meta-xdr"
						label="Transaction Result Meta:"
						item={
							<XdrJsonViewer
								xdr={response.result.resultMetaXdr.toXDR("base64").toString()}
								typeVariant="TransactionMeta"
							/>
						}
					/>

					<TxResponse label="Fee:" value={response.fee} />
				</Box>
			}
		/>
	)
}
