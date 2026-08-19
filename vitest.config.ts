import { defineConfig, type Plugin } from "vitest/config"

// @stellar/design-system imports .scss and .svg files directly; stub them
// out for tests. resolveId is needed — transform only runs on successfully
// resolved files, but these imports fail at the resolution stage.
const stubStyles: Plugin = {
	name: "stub-styles",
	enforce: "pre",
	resolveId(id) {
		if (/\.(css|scss|sass|less)(\?.*)?$/.test(id)) {
			return "\0stub-style"
		}
		if (/\.svg(\?.*)?$/.test(id)) {
			return "\0stub-svg"
		}
	},
	load(id) {
		if (id === "\0stub-style") return "export default {}"
		if (id === "\0stub-svg") {
			return "export const ReactComponent = () => null; export default ''"
		}
	},
}

export default defineConfig({
	plugins: [stubStyles],
	test: {
		environment: "jsdom",
		setupFiles: ["tests/setup.ts"],
		include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.tsx"],
		typecheck: {
			tsconfig: "./tsconfig.test.json",
		},
	},
})
