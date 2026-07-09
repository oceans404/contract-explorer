const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"]

/**
 * Whether the stellar-sdk should be allowed to talk to this RPC URL over
 * plaintext HTTP. Only loopback hosts qualify: running a local node behind TLS
 * is needless friction, while every real network is https.
 *
 * Every caller must agree on this rule. If the contract loader allows a URL the
 * transaction hooks later reject, contracts appear to load but every submission
 * against that same endpoint fails.
 *
 * A scheme-less url either throws (`example.com/rpc`) or parses with a non-http
 * scheme (`localhost:8000` -> `localhost:`); neither is allowed through.
 */
export const allowHttp = (rpcUrl: string): boolean => {
	const { protocol, hostname } = new URL(rpcUrl)
	return protocol === "http:" && LOOPBACK_HOSTS.includes(hostname)
}
