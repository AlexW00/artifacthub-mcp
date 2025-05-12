import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChartInfo } from "../services/artifactHub.js";
import { InfoParams } from "../types/artifactHub.js";

// Register the info tool with the server
export function registerInfoTool(server: McpServer) {
	return server.tool(
		"helm-chart-info",
		"Get information about a Helm chart from Artifact Hub, including ID, latest version, and description",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
		},
		async ({ chartRepo, chartName }: InfoParams) => {
			try {
				const data = await getChartInfo(chartRepo, chartName);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									id: data.package_id,
									latest_version: data.version,
									description: data.description,
								},
								null,
								2
							),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error retrieving chart info: ${(error as Error).message}`,
						},
					],
				};
			}
		}
	);
}
