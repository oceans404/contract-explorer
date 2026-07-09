import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/e2e/**/*.test.ts"],
		// E2E tests hit a real local Stellar network — give them time
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
})
