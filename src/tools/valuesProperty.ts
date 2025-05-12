import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parse, parseDocument } from "yaml";
import { z } from "zod";
import { getChartInfo, getChartValues } from "../services/artifactHub.js";
import { YamlPathParams } from "../types/artifactHub.js";

// Helper function to get a value from a YAML path
function getValueFromPath(
	yamlContent: string,
	path: string
): { value: any; comment?: string } {
	// Parse YAML to get the value
	const parsedYaml = parse(yamlContent);

	// Also parse with document to try to get comments
	const doc = parseDocument(yamlContent);

	// Convert path to array (e.g., "replicaCount.web" => ["replicaCount", "web"])
	const pathParts = path.split(".");

	// First get the value using standard object navigation
	let currentValue = parsedYaml;
	for (const part of pathParts) {
		if (
			currentValue &&
			typeof currentValue === "object" &&
			part in currentValue
		) {
			currentValue = currentValue[part];
		} else {
			currentValue = undefined;
			break;
		}
	}

	// Try to extract comments if possible (simplified approach)
	let comment: string | undefined = undefined;
	try {
		// Navigate through the document to find comments
		let currentNode = doc.contents;
		for (const part of pathParts) {
			if (
				currentNode &&
				typeof currentNode === "object" &&
				"get" in currentNode
			) {
				const node = currentNode.get(part);
				if (node) {
					if (node.commentBefore) {
						comment = node.commentBefore;
					}
					currentNode = node;
				} else {
					break;
				}
			} else {
				break;
			}
		}
	} catch (e) {
		// If we can't get comments, just ignore and continue
		console.error("Error extracting comments:", e);
	}

	return {
		value: currentValue,
		comment,
	};
}

// Register the tool to get a specific value from values.yaml
export function registerValuesPropertyTool(server: McpServer) {
	return server.tool(
		"helm-chart-value-property",
		"Get a specific property from a Helm chart's values.yaml using a YAML path",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
			yamlPath: z
				.string()
				.describe(
					"The YAML path to the property (e.g., 'replicaCount' or 'image.tag')"
				),
			version: z
				.string()
				.optional()
				.describe("The chart version (optional, defaults to latest)"),
		},
		async ({ chartRepo, chartName, yamlPath, version }: YamlPathParams) => {
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

				// Extract the requested property
				const { value, comment } = getValueFromPath(valuesYaml, yamlPath);

				let responseText = "";

				if (value !== undefined) {
					// If there's a comment, include it
					if (comment) {
						responseText += `# Comment:\n${comment.trim()}\n\n`;
					}

					// Add the value
					responseText += `# Value at path ${yamlPath}:\n`;

					// Format the value based on its type
					if (typeof value === "object") {
						responseText += JSON.stringify(value, null, 2);
					} else {
						responseText += String(value);
					}
				} else {
					responseText = `Property not found at path: ${yamlPath}`;
				}

				return {
					content: [
						{
							type: "text",
							text: responseText,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error retrieving value: ${(error as Error).message}`,
						},
					],
				};
			}
		}
	);
}
