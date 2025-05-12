import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFuzzySearchTemplatesTool } from "./tools/fuzzySearchTemplates.js";
import { registerFuzzySearchValuesTool } from "./tools/fuzzySearchValues.js";
import { registerInfoTool } from "./tools/info.js";
import { registerTemplateTool } from "./tools/template.js";
import { registerValuesTool } from "./tools/values.js";

// Create a new MCP server
const server = new McpServer({
	name: "artifacthub-mcp",
	version: "1.0.0",
	description: "MCP server for Artifact Hub charts",
});

// Register tools
registerInfoTool(server);
registerValuesTool(server);
registerFuzzySearchValuesTool(server);
registerTemplateTool(server);
registerFuzzySearchTemplatesTool(server);

// Connect the server to standard I/O
const transport = new StdioServerTransport();

// Start the server
async function main() {
	try {
		await server.connect(transport);
		console.error("MCP server for Artifact Hub started");
	} catch (error) {
		console.error("Error starting server:", error);
		process.exit(1);
	}
}

main();
