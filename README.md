# ArtifactHub MCP Server

This is a Model Context Protocol (MCP) server for interacting with Helm charts on [Artifacthub](https://artifacthub.io/).

<a href="https://glama.ai/mcp/servers/@AlexW00/artifacthub-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@AlexW00/artifacthub-mcp/badge" alt="ArtifactHub Server MCP server" />
</a>

## Usage

For VS-Code, click this [auto-install-link](https://insiders.vscode.dev/redirect/mcp/install?name=artifacthub-mcp&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22ghcr.io%2Falexw00%2Fartifacthub-mcp%3Alatest%22%5D%7D).

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

## Available tools

- helm-chart-info: get information about a Helm chart such as id and latest version
- helm-chart-values: get the default values.yaml of a Helm chart
- helm-chart-values-fuzzy-search: fuzzy search for a value in the default values.yaml of a Helm chart
- helm-chart-template: get a template of a Helm chart by name
- helm-chart-template-fuzzy-search: fuzzy search the names/contents of templates