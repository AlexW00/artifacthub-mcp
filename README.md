# ArtifactHub MCP Server

This is a Model Context Protocol (MCP) server for interacting with ArtifactHub. It provides tools to retrieve information about Helm charts and their values.

## Usage

You can run this MCP server using Docker:

```bash
docker run -i ghcr.io/AlexW00/artifacthub-mcp:latest
```

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
