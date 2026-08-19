import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TransactionSuccessCard } from "../../src/components/TransactionSuccessCard"
import { type SubmitRpcResponse } from "../../src/types/types"

// The real decoder is a WASM module that cannot initialize under jsdom.
const decode = vi.fn<(type: string, xdr: string) => string>()
vi.mock("../../src/util/StellarXdr", () => ({
	initialize: () => Promise.resolve(),
	decode: (type: string, xdr: string) => decode(type, xdr),
	guess: () => ["ScVal"],
}))

const xdrStub = (value: string) => ({ toXDR: () => value })

/**
 * Builds the minimum response shape the card reads. `returnValue` is the only
 * field under test; the rest exist so the detailed response can be constructed.
 */
const makeResponse = (returnValue: unknown): SubmitRpcResponse =>
	({
		hash: "abc123",
		operationCount: 1,
		fee: "100",
		result: {
			ledger: 42,
			returnValue,
			envelopeXdr: xdrStub("envelope"),
			resultXdr: xdrStub("result"),
			resultMetaXdr: xdrStub("meta"),
		},
	}) as unknown as SubmitRpcResponse

describe("TransactionSuccessCard", () => {
	beforeEach(() => {
		decode.mockReset()
	})

	it("shows the decoded return value", async () => {
		decode.mockReturnValue(JSON.stringify({ i128: "5" }))
		render(<TransactionSuccessCard response={makeResponse(xdrStub("rv"))} />)

		await waitFor(() =>
			expect(screen.getByTestId("return-value")).toHaveTextContent(
				'"i128": "5"',
			),
		)
	})

	it("shows a falsy decoded value", async () => {
		decode.mockReturnValue(JSON.stringify({ bool: false }))
		render(<TransactionSuccessCard response={makeResponse(xdrStub("rv"))} />)

		await waitFor(() =>
			expect(screen.getByTestId("return-value")).toHaveTextContent(
				'"bool": false',
			),
		)
	})

	it("shows nothing for a void return", async () => {
		decode.mockReturnValue(JSON.stringify("void"))
		render(<TransactionSuccessCard response={makeResponse(xdrStub("rv"))} />)

		await waitFor(() => expect(decode).toHaveBeenCalled())
		expect(screen.queryByTestId("return-value")).not.toBeInTheDocument()
	})

	it("shows nothing when the operation carries no return value", async () => {
		render(<TransactionSuccessCard response={makeResponse(undefined)} />)

		expect(await screen.findByText(/Transaction succeeded/)).toBeInTheDocument()
		expect(decode).not.toHaveBeenCalled()
		expect(screen.queryByTestId("return-value")).not.toBeInTheDocument()
	})

	it("reports a decode failure instead of staying silent", async () => {
		decode.mockImplementation(() => {
			throw new Error("bad xdr")
		})
		vi.spyOn(console, "error").mockImplementation(() => {})
		render(<TransactionSuccessCard response={makeResponse(xdrStub("rv"))} />)

		expect(await screen.findByTestId("return-value-error")).toBeInTheDocument()
	})

	it("clears the previous value when a later response has none", async () => {
		decode.mockReturnValue(JSON.stringify({ u32: 7 }))
		const { rerender } = render(
			<TransactionSuccessCard response={makeResponse(xdrStub("rv"))} />,
		)
		expect(await screen.findByTestId("return-value")).toBeInTheDocument()

		rerender(<TransactionSuccessCard response={makeResponse(undefined)} />)
		await waitFor(() =>
			expect(screen.queryByTestId("return-value")).not.toBeInTheDocument(),
		)
	})
})
