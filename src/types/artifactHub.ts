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
