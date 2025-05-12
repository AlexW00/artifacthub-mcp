import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Fuse from "fuse.js";
import { parse, parseDocument } from "yaml";
import { z } from "zod";
import { getChartInfo, getChartValues } from "../services/artifactHub.js";
import { ValuesParams } from "../types/artifactHub.js";

// Interface for a property in the values.yaml file
interface ValueProperty {
	propertyName: string;
	propertyPath: string;
	comment?: string;
	value?: any;
}

// Recursively collect all properties from the YAML object
function collectPropertiesRecursive(
	obj: any,
	currentPath = "",
	doc: any,
	result: ValueProperty[] = []
): ValueProperty[] {
	if (obj === null || typeof obj !== "object") {
		return result;
	}

	for (const key in obj) {
		const value = obj[key];
		const newPath = currentPath ? `${currentPath}.${key}` : key;

		// Try to extract comment for this property
		let comment: string | undefined = undefined;
		try {
			// Navigate through the document to find comments
			let currentNode = doc.contents;
			for (const part of newPath.split(".")) {
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
		}

		// Add property to result
		const property: ValueProperty = {
			propertyName: key,
			propertyPath: newPath,
			comment,
		};

		// Only add value if it's not an object
		if (value === null || typeof value !== "object") {
			property.value = value;
		}

		result.push(property);

		// Recursively process nested objects
		if (value !== null && typeof value === "object") {
			collectPropertiesRecursive(value, newPath, doc, result);
		}
	}

	return result;
}

// Interface for fuzzy search params
interface FuzzySearchParams extends ValuesParams {
	searchQuery: string;
}

// Register the tool to fuzzy search values.yaml properties
export function registerFuzzySearchValuesTool(server: McpServer) {
	return server.tool(
		"helm-chart-values-fuzzy-search",
		"Fuzzy search through all properties in a Helm chart's values.yaml file",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
			searchQuery: z.string().describe("The search query for fuzzy matching"),
			version: z
				.string()
				.optional()
				.describe("The chart version (optional, defaults to latest)"),
		},
		async ({
			chartRepo,
			chartName,
			searchQuery,
			version,
		}: FuzzySearchParams) => {
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

				// Parse YAML to get the value
				const parsedYaml = parse(valuesYaml);
				const doc = parseDocument(valuesYaml);

				// Collect all properties recursively
				const allProperties = collectPropertiesRecursive(parsedYaml, "", doc);

				// Set up Fuse.js for fuzzy searching
				const fuse = new Fuse(allProperties, {
					keys: ["propertyName", "propertyPath", "comment", "value"],
					includeScore: true,
					threshold: 0.4,
				});

				// Perform the fuzzy search
				const searchResults = fuse.search(searchQuery);

				// Format the results
				let responseText = "";
				if (searchResults.length > 0) {
					responseText = `# Found ${searchResults.length} matching properties:\n\n`;

					searchResults.forEach((result, index) => {
						const property = result.item;
						responseText += `## ${index + 1}. ${property.propertyPath}\n`;

						if (property.comment) {
							responseText += `Comment: ${property.comment.trim()}\n`;
						}

						if (property.value !== undefined) {
							responseText += `Value: ${
								typeof property.value === "object"
									? JSON.stringify(property.value, null, 2)
									: String(property.value)
							}\n`;
						} else {
							responseText += "Value: [object]\n";
						}

						responseText += "\n";
					});
				} else {
					responseText = `No properties matching "${searchQuery}" found.`;
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
							text: `Error performing fuzzy search: ${
								(error as Error).message
							}`,
						},
					],
				};
			}
		}
	);
}
