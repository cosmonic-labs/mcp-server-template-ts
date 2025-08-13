# mcp-server-template

Template repository for creating a WebAssembly component [Model Context Protocol (MCP)][mcp] Server,
with [wasmCloud][wasmcloud].

[mcp]: https://modelcontextprotocol.io/docs/getting-started/intro
[wasmcloud]: https://wasmcloud.com

# Dependencies

- Download [`wash`][wash]

[wash]: https://github.com/cosmonic-labs/wash

# Quickstart

## Start the Development loop

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

Using the model inspector you can connect to the local MCP server via HTTP,
manipulate resources, run tools, and more.

[model-inspector]: https://github.com/modelcontextprotocol/inspector

## Generate a production-ready repository

### 1. Use our golden template to build a repository:

```console
wash new <...>
```

If you have have a pre-existing OpenAPI schema, add it to the repository:

```console
cp path/to/schema infra/openapi/schema
```

> [!NOTE]
> It's fine if you don't have a local file OpenAPI schema,
> you can use a URL to a hosted schema later.

After that you can push to GitHub:

```console
git push
```

#### Alternatively, clone our template repository on GitHub

< LINK TO GOLDEN TEMPLATE >

### 2. Generate a WebAssembly component from your repo

To generate a WebAssembly component from your repository, use the pre-packaged
Github Action that publishes the component:

Run the public action <action name> which will build the component and push it to a temporary
registry ([tty.sh](https://tty.sh)).


## Deploy

### Set up Cosmonic Control

Once your MCP server is ready for primetime, ensure your [Comonic][cosmonic] cluster is running.

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
```
</details>

### Deploy the application

With the operator up and running we can start a `HostGroup`, which is a set of [wasmCloud][wasmcloud]
instances that are configured to work together.

### With Helm CLI

```console
helm install <example helm project repo> \
  --namespace <ns> \
  --component-ref oci://tty.sh/<org>/<repo>/v1:1h \
  --http-config-endpoints
```

### With ArgoCD

If using ArgoCD, you can install the following Helm chart:

```
<example helm project repo>
```

## Connect to the deployed MCP server

If running with a k8s cluster, you can port forward:

```console
kubectl port-forward svc/<host-service>:<port>
```

Once you have a local port forward configured to your Cosmonic Control cluster,
use [the official MCP model inspector][model-inspector] to connect.

You can start the MCP inspector via the following command:

```console
npm run inspector
```

[cosmonic]: https://cosmonic.com
[cosmonic-free-license]: https://cosmonic.com/trial?utm_source=mcp-demo
