// Utility functions to interact with Artifact Hub API
import {
	ArtifactHubPackage,
	ChartTemplatesResponse,
	DecodedChartTemplate,
} from "../types/artifactHub.js";

// Fetch data from Artifact Hub API
export async function fetchFromArtifactHub(
	url: string,
	isYaml: boolean = false
): Promise<any> {
	try {
		const response = await fetch(url, {
			headers: {
				Accept: isYaml ? "application/yaml" : "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`API request failed with status ${response.status}: ${response.statusText}`
			);
		}

		if (isYaml) {
			return await response.text();
		} else {
			return await response.json();
		}
	} catch (error) {
		console.error("Error fetching from Artifact Hub:", error);
		throw error;
	}
}

// Get chart info from Artifact Hub
export async function getChartInfo(
	chartRepo: string,
	chartName: string
): Promise<ArtifactHubPackage> {
	const url = `https://artifacthub.io/api/v1/packages/helm/${encodeURIComponent(
		chartRepo
	)}/${encodeURIComponent(chartName)}`;
	return (await fetchFromArtifactHub(url)) as ArtifactHubPackage;
}

// Get chart values.yaml from Artifact Hub
export async function getChartValues(
	packageId: string,
	version: string
): Promise<string> {
	const valuesUrl = `https://artifacthub.io/api/v1/packages/${packageId}/${version}/values`;
	return await fetchFromArtifactHub(valuesUrl, true);
}

// Get chart templates from Artifact Hub
export async function getChartTemplates(
	packageId: string,
	version: string
): Promise<{ templates: DecodedChartTemplate[] }> {
	const templatesUrl = `https://artifacthub.io/api/v1/packages/${packageId}/${version}/templates`;
	const response = (await fetchFromArtifactHub(
		templatesUrl
	)) as ChartTemplatesResponse;

	// Decode base64 data for each template
	return {
		templates: response.templates.map((template) => ({
			name: template.name,
			content: Buffer.from(template.data, "base64").toString("utf-8"),
		})),
	};
}
