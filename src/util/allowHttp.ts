/**
 * Whether the stellar-sdk should be allowed to talk to this RPC URL over
 * plaintext HTTP.
 *
 * Every caller must agree: if the contract loader allows a URL that the
 * transaction hooks later reject, contracts appear to load but every
 * submission fails against the same endpoint.
 *
 * Throws on a URL with no scheme, which is a config error worth surfacing
 * early rather than silently treating as https.
 */
export const allowHttp = (rpcUrl: string): boolean =>
	new URL(rpcUrl).protocol === "http:"
