/**
 * Minimal counter contract fixture representing what Scaffold Stellar generates
 * for a simple contract. Built from XDR spec entries — no network required.
 *
 * Functions:
 *   increment(by: u32) -> u32
 *   get_count()        -> u32
 */
import { xdr } from "@stellar/stellar-sdk"
import { Client, Spec } from "@stellar/stellar-sdk/contract"

const entries = [
	xdr.ScSpecEntry.scSpecEntryFunctionV0(
		new xdr.ScSpecFunctionV0({
			doc: Buffer.from("Increment the counter by the given amount"),
			name: Buffer.from("increment"),
			inputs: [
				new xdr.ScSpecFunctionInputV0({
					doc: Buffer.from("Amount to increment by"),
					name: Buffer.from("by"),
					type: xdr.ScSpecTypeDef.scSpecTypeU32(),
				}),
			],
			outputs: [xdr.ScSpecTypeDef.scSpecTypeU32()],
		}),
	),
	xdr.ScSpecEntry.scSpecEntryFunctionV0(
		new xdr.ScSpecFunctionV0({
			doc: Buffer.from("Return the current counter value"),
			name: Buffer.from("get_count"),
			inputs: [],
			outputs: [xdr.ScSpecTypeDef.scSpecTypeU32()],
		}),
	),
]

const counterClient = new Client(new Spec(entries), {
	contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
	networkPassphrase: "Standalone Network ; February 2017",
	rpcUrl: "http://localhost:8000/rpc",
	allowHttp: true,
})

export default counterClient
