import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// vitest.config.ts doesn't set `test.globals: true`, so testing-library's
// automatic afterEach(cleanup) hook (which relies on a global `afterEach`)
// never registers — do it explicitly or DOM leaks across tests in a file.
afterEach(() => cleanup())
