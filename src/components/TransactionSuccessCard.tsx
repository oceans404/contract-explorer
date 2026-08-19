import { Alert } from "@stellar/design-system"
import { useEffect, useState } from "react"
import { type SubmitRpcResponse } from "../types/types"
import { decode, initialize } from "../util/StellarXdr"
import { Box } from "./Box"
import { ReturnValueBox } from "./ReturnValueBox"
import { TxResponse } from "./TxResponse"
import { ValidationResponseCard } from "./ValidationResponseCard"

import { XdrJsonViewer } from "./XdrJsonViewer"

interface TransactionSuccessCardProps {
	response: SubmitRpcResponse
}

/**
 * State of the async ScVal decode. `none` covers both operations that carry no
 * return value (extendTtl, restoreFootprint) and functions returning void, so
 * that falsy decoded values like `false` and `0` are never mistaken for absent.
 */
type DecodeState =
	| { status: "pending" }
	| { status: "none" }
	| { status: "error" }
	| { status: "value"; value: unknown }

export const TransactionSuccessCard = ({
	response,
}: TransactionSuccessCardProps) => {
	const [decoded, setDecoded] = useState<DecodeState>({ status: "pending" })

	useEffect(() => {
		let cancelled = false

		// Reset first so a previous response's value never leaks into this one.
		setDecoded({ status: "pending" })

		const decodeReturnValue = async () => {
			const rv = response.result.returnValue
			if (rv == null) {
				setDecoded({ status: "none" })
				return
			}

			try {
				const rvXdr = rv.toXDR("base64")
				await initialize()
				const rvJson: unknown = JSON.parse(decode("ScVal", rvXdr))

				if (cancelled) return
				// A function with no return type yields ScvVoid, decoded as "void".
				setDecoded(
					rvJson === "void"
						? { status: "none" }
						: { status: "value", value: rvJson },
				)
			} catch (error) {
				console.error("Failed to decode return value:", error)
				if (cancelled) return
				setDecoded({ status: "error" })
			}
		}

		void decodeReturnValue()

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
					{decoded.status === "value" && (
						<ReturnValueBox values={[decoded.value]} />
					)}
					{decoded.status === "error" && (
						<ReturnValueBox error="Return value could not be decoded." />
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
