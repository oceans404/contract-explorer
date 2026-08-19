import { Text } from "@stellar/design-system"

/**
 * Container styling for the return value callout. Matches the surrounding
 * design-system surfaces so the box reads as part of the response card.
 */
const boxStyle = {
	margin: "0.75rem 0",
	padding: "0.75rem 1rem",
	backgroundColor: "var(--sds-clr-gray-03)",
	borderRadius: "0.5rem",
	border: "1px solid var(--sds-clr-green-06)",
}

/**
 * Renders a decoded contract return value as pretty-printed JSON. Objects are
 * stringified with indentation; primitives are coerced to a string so that
 * falsy values such as `false` and `0` still render.
 */
const formatValue = (value: unknown) =>
	typeof value === "object" && value !== null
		? JSON.stringify(value, null, 2)
		: String(value)

/**
 * Displays the values returned by a contract invocation directly beneath the
 * success alert, so users do not have to expand the raw JSON/XDR to find them.
 * Pass `error` instead of `values` when decoding failed.
 */
export const ReturnValueBox = ({
	values,
	error,
}: {
	values?: unknown[]
	error?: string
}) => {
	if (error) {
		return (
			<div style={boxStyle} data-testid="return-value-error">
				<Text size="sm" as="div" weight="bold">
					Return Value:
				</Text>
				<Text size="sm" as="div">
					{error}
				</Text>
			</div>
		)
	}

	if (!values?.length) {
		return null
	}

	return (
		<div style={boxStyle} data-testid="return-value">
			<Text size="sm" as="div" weight="bold">
				{values.length > 1 ? "Return Values:" : "Return Value:"}
			</Text>
			{values.map((value, i) => (
				<pre key={i} style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0" }}>
					{formatValue(value)}
				</pre>
			))}
		</div>
	)
}
