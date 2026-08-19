/**
 * Extract a human-readable message from an unknown thrown value.
 *
 * `String(error)` renders a plain object as "[object Object]", and the
 * stellar-sdk rejects with bare `{ code, message }` shapes rather than Errors,
 * so contract load failures would otherwise be undiagnosable.
 */
export const errorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message

	if (typeof error === "object" && error !== null) {
		const { message, code } = error as { message?: unknown; code?: unknown }
		if (typeof message === "string") {
			return code === undefined ? message : `${message} (code ${String(code)})`
		}
		try {
			return JSON.stringify(error)
		} catch {
			// fall through to String() for circular structures
		}
	}

	return String(error)
}
