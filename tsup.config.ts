import { defineConfig } from "tsup"

export default defineConfig([
	// Library bundle — consumed by React/Vite dApps
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		clean: false,
		dts: true,
		sourcemap: true,
		splitting: false,
		external: ["react", "react-dom"],
		treeshake: true,
		minify: false,
		injectStyle: true,
	},
	// Standalone app bundle — served by the dev server, runs in the browser
	{
		entry: { index: "src/app/index.tsx" },
		outDir: "dist/app",
		format: ["esm"],
		clean: false,
		dts: false,
		sourcemap: false,
		splitting: false,
		treeshake: true,
		minify: true,
		injectStyle: true,
		platform: "browser",
	},
	// Dev server CLI — Node.js binary
	{
		entry: { index: "src/server/index.ts" },
		outDir: "dist/server",
		format: ["cjs"],
		clean: false,
		dts: false,
		sourcemap: false,
		splitting: false,
		treeshake: true,
		platform: "node",
		target: "node18",
		banner: { js: "#!/usr/bin/env node" },
	},
])
