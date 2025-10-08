# mcp-server-template

Template repository for creating a WebAssembly component [Model Context Protocol (MCP)][mcp] Server,
with [wasmCloud][wasmcloud].

[mcp]: https://modelcontextprotocol.io/docs/getting-started/intro
[wasmcloud]: https://wasmcloud.com

# Dependencies

- Download [`wash`][wash]

[wash]: https://github.com/wasmcloud/wash

# Quickstart

Clone this repository or use `wash` to create a new project that uses this repo as a template:

```console
wash new mcpserver --git https://github.com/cosmonic-labs/mcp-server-template-ts.git
```
```console
cd mcpserver
```

## Start the development loop

Build the component:

```console
npm install
npm run dev
```

To debug your component, we recommend using [the official MCP model inspector][model-inspector],
to run that you can run:

```console
npm run inspector
```

Using the model inspector you can connect to the local MCP server via HTTP, manipulate resources, run tools, and more.

[model-inspector]: https://github.com/modelcontextprotocol/inspector

## Optional: Generate MCP tools with the `openapi2mcp` plugin

The [`openapi2mcp` plugin](https://github.com/cosmonic-labs/openapi2mcp) for `wash` enables you to generate MCP tools from an OpenAPI specification.

Install the plugin:

```console
wash plugin install ghcr.io/cosmonic-labs/plugins/openapi2mcp:0.5.0
```

Generate MCP tools into the server project from an OpenAPI specification:

```console
wash openapi2mcp [path/to/open/yaml/or/json] --project-path [path/to/generated/mcp/server]
```

### Set up Cosmonic Control

Once your MCP server is ready for primetime, ensure your [Cosmonic][cosmonic] cluster is running.

<details>
<summary>Don't have a Comsonic cluster set up?</summary>

First, sign up for a [FREE Cosmonic license][cosmonic-free-license].

Once you have a license key, you can set up a Cosmonic cluster on any Kubernetes cluster
that supports Helm:

```console
helm install cosmonic-control oci://ghcr.io/cosmonic/cosmonic-control \
  --version 0.2.0 \
  --namespace cosmonic-system \
  --create-namespace \
  --set cosmonicLicenseKey="<insert license here>"

helm install hostgroup oci://ghcr.io/cosmonic/cosmonic-control-hostgroup --version 0.2.0 --namespace cosmonic-system --set http.enabled=true
```
</details>

### Deploy the application

With the operator up and running we can start a `HostGroup`, which is a set of [wasmCloud][wasmcloud]
instances that are configured to work together.

### With Helm CLI

```console
# Note substitue your own pushed image
helm install weather-gov-mcp oci://ghcr.io/cosmonic-labs/charts/http-sample \
  -n weather-gov --create-namespace \
  --set component.image=ghcr.io/cosmonic-labs/components/weather-gov-mcp:0.1.0 \
  --set component.name=weather-gov-mcp 
```

## Connect to the deployed MCP server

If running with a k8s cluster, you can port forward:

```console
kubectl -n cosmonic-system port-forward svc/hostgroup-default 9091:9091
```

Once you have a local port forward configured to your Cosmonic Control cluster,
use [the official MCP model inspector][model-inspector] to connect.

You can start the MCP inspector via the following command:

```console
npm run inspector
```

[cosmonic]: https://cosmonic.com
[cosmonic-free-license]: https://cosmonic.com/trial?utm_source=mcp-demo
