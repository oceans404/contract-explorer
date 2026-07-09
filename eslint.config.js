import { config } from "@theahaco/ts-config/eslint"

/** @type {import("eslint").Linter.Config[]} */
export default [
	...config,
	{
		// The shared config enables `projectService`, which only discovers
		// tsconfig.json — and that excludes **/*.test.ts?(x). Point test files at
		// tsconfig.test.json so type-aware rules can resolve them.
		files: ["tests/**/*.ts", "tests/**/*.tsx"],
		languageOptions: {
			parserOptions: {
				projectService: false,
				project: "./tsconfig.test.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
]
