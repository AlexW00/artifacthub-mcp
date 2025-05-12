import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChartInfo, getChartValues } from "../services/artifactHub.js";
import { ValuesParams } from "../types/artifactHub.js";

// Register the values tool with the server
export function registerValuesTool(server: McpServer) {
	return server.tool(
		"values",
		"Get the values.yaml file for a specific Helm chart from Artifact Hub",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
			version: z
				.string()
				.optional()
				.describe("The chart version (optional, defaults to latest)"),
		},
		async ({ chartRepo, chartName, version }: ValuesParams) => {
			try {
				let packageId: string;
				let chartVersion: string;

				// First get the chart info
				const chartInfo = await getChartInfo(chartRepo, chartName);
				packageId = chartInfo.package_id;

				// If version is not provided, use the latest version
				chartVersion = version || chartInfo.version;

				// Get the values.yaml
				const valuesYaml = await getChartValues(packageId, chartVersion);

				return {
					content: [
						{
							type: "text",
							text: valuesYaml,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error retrieving values.yaml: ${(error as Error).message}`,
						},
					],
				};
			}
		}
	);
}
