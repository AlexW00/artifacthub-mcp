import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChartInfo, getChartTemplates } from "../services/artifactHub.js";
import { TemplatesParams } from "../types/artifactHub.js";

// Register the templates tool with the server
export function registerTemplateTool(server: McpServer) {
	return server.tool(
		"helm-chart-template",
		"Get the content of a template file from a Helm chart in Artifact Hub",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
			filename: z
				.string()
				.describe(
					"Exact filename (full path) to filter templates by (case-sensitive)"
				),
			version: z
				.string()
				.optional()
				.describe("The chart version (optional, defaults to latest)"),
		},
		async ({ chartRepo, chartName, filename, version }: TemplatesParams) => {
			try {
				let packageId: string;
				let chartVersion: string;

				// First get the chart info
				const chartInfo = await getChartInfo(chartRepo, chartName);
				packageId = chartInfo.package_id;

				// If version is not provided, use the latest version
				chartVersion = version || chartInfo.version;

				// Get the templates
				const templatesResult = await getChartTemplates(
					packageId,
					chartVersion
				);

				// Filter templates by exact filename match
				const filteredTemplates = templatesResult.templates.filter(
					(template) => template.name === filename
				);

				// Format the response
				const formattedResponse = filteredTemplates
					.map((template) => {
						return `--- Template: ${template.name} ---\n${template.content}\n\n`;
					})
					.join("");

				return {
					content: [
						{
							type: "text",
							text:
								formattedResponse ||
								"No matching templates found for this chart",
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error retrieving templates: ${(error as Error).message}`,
						},
					],
				};
			}
		}
	);
}
