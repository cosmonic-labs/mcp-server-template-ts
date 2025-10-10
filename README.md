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
wash plugin install ghcr.io/cosmonic-labs/openapi2mcp:v0.5.0
```

Generate MCP tools into the server project from an OpenAPI specification:

```console
wash openapi2mcp [path/to/open/yaml/or/json] --project-path [path/to/generated/mcp/server]
```

### Set up Cosmonic Control

Once your MCP server is ready for primetime, ensure your [Cosmonic][cosmonic] cluster is running.

<details>
<summary>Don't have a Comsonic cluster set up?</summary>


:::warning[Cosmonic Control required]
You will need a Kubernetes cluster and an installation of Cosmonic Control to deploy the component. Sign-up for Cosmonic Control's [free trial](https://cosmonic.com/trial) and follow the [Get Started](/docs/install-cosmonic-control) instructions in the Cosmonic Control documentation. 
:::

Requirements:

* [`kubectl`](https://kubernetes.io/releases/download/)
* [Helm](https://helm.sh/docs) v3.8.0+

#### Install local Kubernetes environment

For the best local Kubernetes development experience, we recommend installing `kind` with the following `kind-config.yaml` configuration:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
# One control plane node and three "workers."
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30950
    hostPort: 80
    protocol: TCP
```

This will help enable simple local ingress with Envoy.

Start the cluster:

```shell
kind create cluster --config=kind-config.yaml
```

#### Install Cosmonic Control

:::warning[License key required]
You'll need a **trial license key** to follow these instructions. Sign up for Cosmonic Control's [free trial](/trial) to get a key.
:::

Deploy Cosmonic Control to Kubernetes with Helm:

```shell
helm install cosmonic-control oci://ghcr.io/cosmonic/cosmonic-control\
  --version 0.3.0\
  --namespace cosmonic-system\
  --create-namespace\
  --set envoy.service.type=NodePort\
  --set envoy.service.httpNodePort=30950\
  --set cosmonicLicenseKey="<insert license here>"
```

Deploy a HostGroup:

```shell
helm install hostgroup oci://ghcr.io/cosmonic/cosmonic-control-hostgroup --version 0.3.0 --namespace cosmonic-system
```
</details>

### Deploy the application with Helm CLI

Make sure to substitute your own pushed image in the command below:

```shell
helm install cosmonic-control oci://ghcr.io/cosmonic-labs/charts/http-trigger\
  --version 0.1.2\
  --set components.name=mcpserver\
  --set components.image=ghcr.io/cosmonic-labs/petstore-mcp-server:v0.2.0\
  --set ingress.host="mcpserver.localhost.cosmonic.sh"\
  --set pathNote="/v1/mcp"
```

## Connect to the deployed MCP server

You can use [the official MCP model inspector][model-inspector] to connect. Start the MCP inspector via the following command:

```console
npx @modelcontextprotocol/inspector
```

[cosmonic]: https://cosmonic.com
[cosmonic-free-license]: https://cosmonic.com/trial?utm_source=mcp-demo
