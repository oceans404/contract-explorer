import { describe, it, expect } from "vitest"
import { allowHttp } from "../../../src/util/allowHttp"

describe("allowHttp", () => {
	it("allows plaintext http on loopback hosts", () => {
		expect(allowHttp("http://localhost:8000/rpc")).toBe(true)
		expect(allowHttp("http://127.0.0.1:8000/rpc")).toBe(true)
		expect(allowHttp("http://[::1]:8000/rpc")).toBe(true)
	})

	it("refuses plaintext http to a remote host", () => {
		expect(allowHttp("http://10.0.0.5:8000/rpc")).toBe(false)
		expect(allowHttp("http://rpc.stellar.org")).toBe(false)
	})

	it("returns false for https, loopback or not", () => {
		expect(allowHttp("https://soroban-testnet.stellar.org")).toBe(false)
		expect(allowHttp("https://localhost:8000/rpc")).toBe(false)
	})

	it("never silently allows plaintext for a scheme-less url", () => {
		// parses, but with scheme "localhost:" rather than "http:"
		expect(allowHttp("localhost:8000/rpc")).toBe(false)
		// not a url at all
		expect(() => allowHttp("example.com/rpc")).toThrow()
	})
})
