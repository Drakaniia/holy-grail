// Streamable HTTP transport (2026-07-28 spec era). One POST endpoint; every
// request is an independent stateless JSON-RPC exchange (no sessions, no
// initialize handshake required). Middleware enforces the transport-level
// requirements: Origin allowlist (DNS-rebinding protection), Accept header,
// MCP-Protocol-Version, and Mcp-Method/Mcp-Name validation when present.
//
// The official TS SDK client sends MCP-Protocol-Version + Accept but not
// Mcp-Method/Mcp-Name, so those are validated only when present (forward-compat
// with the spec without breaking SDK clients).
//
// Runtime-agnostic: works under Bun (local dev) and Node 18+ (Vercel functions).

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from './server.js'

const DEFAULT_ALLOWED_ORIGINS = 'https://holygrail.dev,https://www.holygrail.dev'
const ALLOWED_ORIGINS = (process.env.HOLY_GRAIL_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// Local hosts allowed regardless of port (MCP Inspector, local tooling).
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

const KNOWN_MCP_METHODS = new Set([
  'initialize',
  'ping',
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/templates/list',
  'resources/read',
  'prompts/list',
  'prompts/get',
  'completion/complete',
  'logging/setLevel',
  'notifications/initialized',
])

const MCp_NAME_METHODS = new Set(['tools/call', 'resources/read', 'prompts/get'])

/** Extracts the JSON-RPC method from a (possibly batch) request body. */
function jsonRpcMethod(body: unknown): string | undefined {
  const first = Array.isArray(body) ? body[0] : body
  if (
    first !== null &&
    typeof first === 'object' &&
    'method' in first &&
    typeof first.method === 'string'
  ) {
    return first.method
  }
  return undefined
}

function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return true
  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers':
      'content-type, accept, mcp-protocol-version, mcp-method, mcp-name, authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
}

function jsonError(status: number, message: string, request: Request): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(request) },
  })
}

/** Handles a Web Standard Request against the MCP endpoint (/mcp). */
export async function handleWebRequest(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }
  if (request.method !== 'POST') {
    return jsonError(
      405,
      `Method ${request.method} not allowed — this endpoint accepts POST only`,
      request,
    )
  }

  const origin = request.headers.get('origin')
  if (origin && !isOriginAllowed(origin)) {
    return jsonError(403, 'Forbidden: unknown Origin', request)
  }

  const accept = request.headers.get('accept') ?? ''
  if (!accept.includes('application/json') && !accept.includes('text/event-stream')) {
    return jsonError(
      406,
      'Not Acceptable: Accept header must include application/json or text/event-stream',
      request,
    )
  }

  // Parse the body once and hand it to the transport as parsedBody, so both
  // middleware (initialize version negotiation) and transport see the same JSON.
  let bodyText = ''
  let parsedBody: unknown
  try {
    bodyText = await request.text()
    parsedBody = bodyText ? JSON.parse(bodyText) : undefined
  } catch {
    return jsonError(400, 'Parse error: invalid JSON-RPC message', request)
  }

  const method = jsonRpcMethod(parsedBody)

  // initialize carries its protocol version in the body; the official SDK
  // client sends no MCP-Protocol-Version header on the first POST, so the
  // header is optional for initialize (negotiation happens in the body).
  if (method === 'initialize') {
    let bodyVersion: string | undefined
    if (parsedBody !== null && typeof parsedBody === 'object' && 'params' in parsedBody) {
      const params = parsedBody.params
      if (
        params !== null &&
        typeof params === 'object' &&
        'protocolVersion' in params &&
        typeof params.protocolVersion === 'string'
      ) {
        bodyVersion = params.protocolVersion
      }
    }
    const headerVersion = request.headers.get('mcp-protocol-version')
    if (headerVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(headerVersion)) {
      return jsonError(
        400,
        `UnsupportedProtocolVersionError: unsupported protocol version '${headerVersion}' (supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')})`,
        request,
      )
    }
    if (bodyVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(bodyVersion)) {
      return jsonError(
        400,
        `UnsupportedProtocolVersionError: unsupported protocol version '${bodyVersion}' (supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')})`,
        request,
      )
    }
  } else {
    const protocolVersion = request.headers.get('mcp-protocol-version')
    if (!protocolVersion) {
      return jsonError(
        400,
        'HeaderMismatch: MCP-Protocol-Version header is required on every request',
        request,
      )
    }
    if (!SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion)) {
      return jsonError(
        400,
        `UnsupportedProtocolVersionError: unsupported protocol version '${protocolVersion}' (supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')})`,
        request,
      )
    }
  }

  const methodHeader = request.headers.get('mcp-method')
  if (methodHeader && !KNOWN_MCP_METHODS.has(methodHeader)) {
    return jsonError(400, `HeaderMismatch: unknown Mcp-Method '${methodHeader}'`, request)
  }
  const nameHeader = request.headers.get('mcp-name')
  if (nameHeader && !MCp_NAME_METHODS.has(nameHeader)) {
    return jsonError(
      400,
      `HeaderMismatch: invalid Mcp-Name '${nameHeader}' (allowed: tools/call, resources/read, prompts/get)`,
      request,
    )
  }

  // Fresh transport + server per request: stateless, no session store.
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  try {
    await server.connect(transport)
    const response = await transport.handleRequest(request, { parsedBody })
    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders(request))) {
      if (!headers.has(key)) headers.set(key, value)
    }
    if (!headers.has('X-Accel-Buffering')) headers.set('X-Accel-Buffering', 'no')
    return new Response(response.body, { status: response.status, headers })
  } catch (error) {
    console.error('MCP request failed:', error)
    return jsonError(500, 'Internal server error', request)
  }
}

// ---- node:http wiring (local dev under Bun/Node) ----

import type { IncomingMessage, ServerResponse } from 'node:http'

function toWebRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.url ?? '/', `http://${host}`)
  const headers = new Headers()
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers.append(req.rawHeaders[i], req.rawHeaders[i + 1])
  }
  return new Request(url.toString(), {
    method: req.method ?? 'GET',
    headers,
    body:
      req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        ? (req as unknown as ReadableStream<Uint8Array>)
        : undefined,
    // Required when body is a stream
    duplex: 'half',
  } as RequestInit)
}

async function writeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
  const body = Buffer.from(await response.arrayBuffer())
  res.end(body)
}

/** Node/Vercel-style (req, res) handler for the MCP endpoint. */
export async function handleNodeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const response = await handleWebRequest(toWebRequest(req))
    await writeResponse(res, response)
  } catch (error) {
    console.error('MCP request failed:', error)
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'application/json' })
    }
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

/** Starts a local node:http server exposing POST /mcp. Never resolves. */
export async function serveHttp(port: number, host = '127.0.0.1'): Promise<never> {
  const { createServer: createHttpServer } = await import('node:http')
  const httpServer = createHttpServer((req, res) => {
    void handleNodeRequest(req, res)
  })
  const { promise: listening, resolve, reject } = Promise.withResolvers<void>()
  httpServer.once('error', reject)
  httpServer.listen(port, host, () => resolve())
  await listening
  console.error(`holy-grail-mcp-server listening on http://${host}:${port}/mcp`)
  const { promise: keepAlive } = Promise.withResolvers<never>()
  return keepAlive
}
