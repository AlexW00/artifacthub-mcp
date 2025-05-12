// Types for Artifact Hub API responses
export interface ArtifactHubPackage {
	package_id: string;
	name: string;
	version: string;
	description: string;
	repository: {
		name: string;
	};
	// Additional fields would be here
}

// Parameter types for tools
export interface InfoParams {
	chartRepo: string;
	chartName: string;
}

export interface ValuesParams {
	chartRepo: string;
	chartName: string;
	version?: string;
}

export interface YamlPathParams extends ValuesParams {
	yamlPath: string;
}

export interface TemplatesParams {
	chartRepo: string;
	chartName: string;
	filename: string;
	version?: string;
}

export interface ChartTemplate {
	name: string;
	data: string; // Base64 encoded data
}

// The transformed template with decoded content
export interface DecodedChartTemplate {
	name: string;
	content: string; // Decoded UTF-8 content
}

export interface ChartTemplatesResponse {
	templates: ChartTemplate[];
}
