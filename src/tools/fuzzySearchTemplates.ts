import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Fuse from "fuse.js";
import { z } from "zod";
import { getChartInfo, getChartTemplates } from "../services/artifactHub.js";

// Interface for fuzzy search params
interface FuzzySearchParams {
	chartRepo: string;
	chartName: string;
	searchQuery: string;
	version?: string;
}

// Interface for line-level search items
interface TemplateLineItem {
	templateName: string;
	lineNumber: number;
	lineContent: string;
	templateIndex: number; // To track which template this line belongs to
}

// Context lines to show before and after each match
const CONTEXT_LINES = 3;

// Register the tool to fuzzy search templates
export function registerFuzzySearchTemplatesTool(server: McpServer) {
	return server.tool(
		"helm-chart-templates-fuzzy-search",
		"Fuzzy search through all template filenames/contents in a Helm chart",
		{
			chartRepo: z.string().describe("The Helm chart repository name"),
			chartName: z.string().describe("The Helm chart name"),
			searchQuery: z.string().describe("The search query for fuzzy matching"),
			version: z
				.string()
				.optional()
				.describe("The chart version (optional, defaults to latest)"),
		},
		async (args: FuzzySearchParams) => {
			const { chartRepo, chartName, searchQuery, version } = args;
			try {
				// First get the chart info
				const chartInfo = await getChartInfo(chartRepo, chartName);
				const packageId = chartInfo.package_id;

				// If version is not provided, use the latest version
				const chartVersion = version || chartInfo.version;

				// Get the templates
				const templatesResult = await getChartTemplates(
					packageId,
					chartVersion
				);

				console.log(
					`Searching for "${searchQuery}" in ${templatesResult.templates.length} templates`
				);

				// Process templates into line-level items for better fuzzy searching
				const templateLineItems: TemplateLineItem[] = [];
				const originalTemplates = templatesResult.templates;
				const allTemplateLines: string[][] = [];

				// Pre-process templates into lines
				originalTemplates.forEach((template, templateIndex) => {
					const lines = template.content.split("\n");
					allTemplateLines[templateIndex] = lines; // Store all lines for context retrieval later

					lines.forEach((line, lineIndex) => {
						// Skip empty lines to reduce noise
						if (line.trim()) {
							templateLineItems.push({
								templateName: template.name,
								lineNumber: lineIndex + 1,
								lineContent: line.trim(),
								templateIndex,
							});
						}
					});
				});

				console.log(
					`Prepared ${templateLineItems.length} lines for fuzzy search`
				);

				// Set up Fuse.js for fuzzy searching at line level
				const fuse = new Fuse(templateLineItems, {
					keys: ["lineContent"],
					includeScore: true,
					threshold: 0.4,
					isCaseSensitive: false,
					minMatchCharLength: 3,
				});

				// Perform the fuzzy search
				const searchResults = fuse.search(searchQuery);

				// Group results by template for better display
				const resultsByTemplate = new Map<number, TemplateLineItem[]>();

				searchResults.forEach((result) => {
					const lineItem = result.item;
					if (!resultsByTemplate.has(lineItem.templateIndex)) {
						resultsByTemplate.set(lineItem.templateIndex, []);
					}
					resultsByTemplate.get(lineItem.templateIndex)!.push(lineItem);
				});

				// Helper function to get context lines with line numbers
				function getContextLines(
					templateIndex: number,
					lineNumber: number
				): {
					beforeContext: Array<{ lineNum: number; content: string }>;
					afterContext: Array<{ lineNum: number; content: string }>;
				} {
					const lines = allTemplateLines[templateIndex];
					const beforeContext: Array<{ lineNum: number; content: string }> = [];
					const afterContext: Array<{ lineNum: number; content: string }> = [];

					// Get lines before (adjust for 0-based index)
					const startLine = Math.max(0, lineNumber - 1 - CONTEXT_LINES);
					for (let i = startLine; i < lineNumber - 1; i++) {
						beforeContext.push({
							lineNum: i + 1,
							content: lines[i],
						});
					}

					// Get lines after
					const endLine = Math.min(lines.length, lineNumber + CONTEXT_LINES);
					for (let i = lineNumber; i < endLine; i++) {
						afterContext.push({
							lineNum: i + 1,
							content: lines[i],
						});
					}

					return { beforeContext, afterContext };
				}

				// Format the results with matching lines and context
				let responseText = "";
				if (resultsByTemplate.size > 0) {
					responseText = `# Found matches in ${resultsByTemplate.size} templates:\n\n`;

					Array.from(resultsByTemplate.entries()).forEach(
						([templateIndex, matches], index) => {
							const templateName = matches[0].templateName;

							responseText += `## ${index + 1}. ${templateName}\n`;
							responseText += `### Matching lines with context (${matches.length} total matches):\n\n`;

							// Process each match with context
							const MAX_MATCHES_TO_SHOW = 5; // Limit matches to avoid very long responses
							const matchesToShow = matches.slice(0, MAX_MATCHES_TO_SHOW);

							matchesToShow.forEach((match, matchIndex) => {
								responseText += `#### Match ${matchIndex + 1}:\n`;
								responseText += "```\n";

								// Get context lines
								const { beforeContext, afterContext } = getContextLines(
									match.templateIndex,
									match.lineNumber
								);

								// Display before context
								beforeContext.forEach((line) => {
									responseText += `${line.lineNum}: ${line.content}\n`;
								});

								// Display the matching line highlighted
								responseText += `${match.lineNumber}: ${match.lineContent} <<< MATCH\n`;

								// Display after context
								afterContext.forEach((line) => {
									responseText += `${line.lineNum}: ${line.content}\n`;
								});

								responseText += "```\n\n";
							});

							if (matches.length > MAX_MATCHES_TO_SHOW) {
								responseText += `_${
									matches.length - MAX_MATCHES_TO_SHOW
								} more matches not shown_\n\n`;
							}
						}
					);
				} else {
					responseText = `No templates matching "${searchQuery}" found.`;
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
							text: `Error performing template search: ${
								(error as Error).message
							}`,
						},
					],
				};
			}
		}
	);
}
