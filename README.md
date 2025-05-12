# ArtifactHub MCP Server

This is a Model Context Protocol (MCP) server for interacting with Helm charts on [Artifacthub](https://artifacthub.io/).

## Usage

For VS-Code, click this [auto-install-link](https://insiders.vscode.dev/redirect/mcp/install?name=artifacthub-mcp&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22ghcr.io%2Falexw00%2Fartifacthub-mcp%3A1.0.0%22%5D%7D).

Alternatively, use this MCP configuration:

```json
{
	"servers": {
		"artifacthub-mcp": {
			"type": "stdio",
			"command": "docker",
			"args": ["run", "-i", "--rm", "ghcr.io/alexw00/artifacthub-mcp"]
		}
	}
}
```

[Install ArtifactHub MCP Server](vscode://vscode/extension/mcp?name=artifacthub-mcp&command=docker&args=run,-i,--rm,ghcr.io/alexw00/artifacthub-mcp:1.0.0)

## Available tools

### 1. info

Get information about a Helm chart.

**Parameters:**

- `chartRepo`: The Helm chart repository name
- `chartName`: The Helm chart name

**Returns:**

- `id`: The package ID
- `latest_version`: The latest version of the chart
- `description`: The chart description

### 2. values

Get the values.yaml file for a Helm chart.

**Parameters:**

- `chartRepo`: The Helm chart repository name
- `chartName`: The Helm chart name
- `version`: (Optional) The chart version. If not provided, the latest version is used.

**Returns:**

- The content of the values.yaml file

## Note

This project has been vibe coded
