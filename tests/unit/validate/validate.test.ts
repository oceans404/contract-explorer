// @vitest-environment node
//
// stellar-sdk's Keypair generation relies on @noble/curves, which checks
// `instanceof Uint8Array`. Under jsdom, Uint8Array lives in a separate
// realm from Node's Buffer, so that check fails — run this file in the
// plain node environment instead, since it doesn't touch the DOM.
import { Keypair } from "@stellar/stellar-sdk"
import { describe, it, expect } from "vitest"
import { validate } from "../../../src/validate"

// Representative sample — all validate functions follow the same pattern.
// Add more cases here as edge cases are discovered.

describe("getAmountError", () => {
	it("returns false for valid amounts", () => {
		expect(validate.getAmountError("0")).toBe(false)
		expect(validate.getAmountError("100")).toBe(false)
		expect(validate.getAmountError("9.9999999")).toBe(false)
		expect(validate.getAmountError("0.0000001")).toBe(false)
	})

	it("rejects negative amounts", () => {
		expect(validate.getAmountError("-1")).toBeTruthy()
	})

	it("rejects non-numeric input", () => {
		expect(validate.getAmountError("abc")).toBeTruthy()
		expect(validate.getAmountError("1.2.3")).toBeTruthy()
	})

	it("rejects more than 7 decimal places", () => {
		expect(validate.getAmountError("1.00000001")).toBeTruthy()
		expect(validate.getAmountError("0.12345678")).toBeTruthy()
	})
})

describe("getPublicKeyError", () => {
	const VALID_KEY = Keypair.random().publicKey()

	it("returns false for a valid G-address", () => {
		expect(validate.getPublicKeyError(VALID_KEY)).toBe(false)
	})

	it("returns false for empty input when not required", () => {
		expect(validate.getPublicKeyError("")).toBe(false)
		expect(validate.getPublicKeyError("", false)).toBe(false)
	})

	it("returns an error for empty input when required", () => {
		expect(validate.getPublicKeyError("", true)).toBeTruthy()
	})

	it("rejects an invalid key", () => {
		expect(validate.getPublicKeyError("NOTAKEY")).toBeTruthy()
		expect(validate.getPublicKeyError("SABC123")).toBeTruthy()
	})
})

describe("getContractIdError", () => {
	const VALID_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

	it("returns false for a valid contract ID", () => {
		expect(validate.getContractIdError(VALID_ID)).toBe(false)
	})

	it("rejects invalid contract IDs", () => {
		expect(validate.getContractIdError("notacontract")).toBeTruthy()
		expect(
			validate.getContractIdError(
				"GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
			),
		).toBeTruthy()
		expect(validate.getContractIdError("")).toBeTruthy()
	})
})

describe("getI128Error", () => {
	it("returns false for valid i128 values", () => {
		expect(validate.getI128Error("0")).toBe(false)
		expect(validate.getI128Error("1000")).toBe(false)
		expect(validate.getI128Error("-1")).toBe(false)
		expect(
			validate.getI128Error("170141183460469231731687303715884105727"),
		).toBe(false)
		expect(
			validate.getI128Error("-170141183460469231731687303715884105728"),
		).toBe(false)
	})

	it("returns false for empty input when not required", () => {
		expect(validate.getI128Error("")).toBe(false)
	})

	it("returns an error for empty input when required", () => {
		expect(validate.getI128Error("", true)).toBeTruthy()
	})

	it("rejects values outside i128 range", () => {
		expect(
			validate.getI128Error("170141183460469231731687303715884105728"),
		).toBeTruthy()
		expect(
			validate.getI128Error("-170141183460469231731687303715884105729"),
		).toBeTruthy()
	})

	it("rejects non-integer values", () => {
		expect(validate.getI128Error("1.5")).toBeTruthy()
		expect(validate.getI128Error("abc")).toBeTruthy()
	})
})
