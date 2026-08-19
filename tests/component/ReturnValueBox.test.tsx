import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ReturnValueBox } from "../../src/components/ReturnValueBox"

describe("ReturnValueBox", () => {
	it("renders nothing when there are no values", () => {
		const { container } = render(<ReturnValueBox values={[]} />)
		expect(container).toBeEmptyDOMElement()
	})

	it("renders nothing when values is omitted", () => {
		const { container } = render(<ReturnValueBox />)
		expect(container).toBeEmptyDOMElement()
	})

	it("pretty-prints an object value", () => {
		render(<ReturnValueBox values={[{ i128: "5" }]} />)
		expect(screen.getByTestId("return-value")).toHaveTextContent('"i128": "5"')
	})

	it("renders falsy primitives rather than dropping them", () => {
		render(<ReturnValueBox values={[false]} />)
		expect(screen.getByTestId("return-value")).toHaveTextContent("false")
	})

	it("renders a zero value", () => {
		render(<ReturnValueBox values={[0]} />)
		expect(screen.getByTestId("return-value")).toHaveTextContent("0")
	})

	it("pluralizes the label for multiple values", () => {
		render(<ReturnValueBox values={[1, 2]} />)
		expect(screen.getByText("Return Values:")).toBeInTheDocument()
	})

	it("renders the error message instead of values", () => {
		render(<ReturnValueBox error="Return value could not be decoded." />)
		expect(screen.getByTestId("return-value-error")).toHaveTextContent(
			"Return value could not be decoded.",
		)
	})
})
