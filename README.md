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

Generate a GitHub Repo based on your OpenAPI specification by using this template:

< GITHUB TEMPLATE REPO w/ pre-populated Github Action >

Run the public action <action name> which will build the component and push it to a temporary
registry ([tty.sh](https://tty.sh)).

## Deploy to Cosmonic

Once your MCP server is ready for primetime, run it on your [Comonic][cosmonic] cluster.

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

With the operator up and running we can start a `HostGroup`, which is a set of [wasmCloud][wasmcloud]
instances that are configured to work together:

```console
helm install <example project repo> \
  --component-ref oci://tty.sh/<org>/<repo>/v1:1h
```

[cosmonic]: https://cosmonic.com
[cosmonic-free-license]: https://cosmonic.com/trial?utm_source=mcp-demo
