import { createServer } from "http"
import { readFileSync } from "fs"
import { join } from "path"
import { resolveConfig } from "./config"

const config = resolveConfig()

const APP_JS_PATH = join(__dirname, "../app/index.js")

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contract Explorer</title>
</head>
<body class="sds-theme-dark">
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>`

const server = createServer((req, res) => {
	const url = req.url ?? "/"

	if (url === "/api/config") {
		const body = JSON.stringify({
			contracts: config.contracts,
			network: config.network,
		})
		res.writeHead(200, {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		})
		res.end(body)
		return
	}

	if (url === "/app.js") {
		try {
			const js = readFileSync(APP_JS_PATH)
			res.writeHead(200, { "Content-Type": "application/javascript" })
			res.end(js)
		} catch {
			res.writeHead(500, { "Content-Type": "text/plain" })
			res.end(
				"App bundle not found. Run `npm run build` before starting the server.",
			)
		}
		return
	}

	res.writeHead(200, { "Content-Type": "text/html" })
	res.end(HTML)
})

server.listen(config.port, "localhost", () => {
	console.log(`\nContract Explorer running at http://localhost:${config.port}\n`)
	console.log(`  Network:   ${config.network.label} (${config.network.rpcUrl})`)
	console.log(
		`  Contracts: ${Object.entries(config.contracts)
			.map(([name, id]) => `${name} (${id})`)
			.join(", ")}`,
	)
	console.log("\nOpen the URL above in your browser to explore your contracts.\n")
})
