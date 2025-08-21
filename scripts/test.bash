#!/bin/env bash

curl -N \
     -v \
     -H "Accept: text/event-stream" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:${PORT}/v1/mcp \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
