import { McpServer as UpstreamMCPServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from 'hono';

/**
 * OAuth configuration for the MCP server
 */
export interface OAuthConfig {
  authorizationServerUrl: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  resourceIndicator?: string;
}

/**
 * ProxyOAuthServerProvider implements OAuth 2.1 authentication for MCP servers
 * following the MCP specification for authorization.
 *
 * This provider acts as a resource server that validates OAuth access tokens
 * and integrates with existing OAuth authorization servers.
 */
export class ProxyOAuthServerProvider {
  private config: OAuthConfig;
  private authorizationServerMetadata: any = null;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Discover authorization server metadata according to RFC 8414
   */
  async discoverAuthorizationServer(): Promise<void> {
    try {
      const metadataUrl = `${this.config.authorizationServerUrl}/.well-known/oauth-authorization-server`;
      const response = await fetch(metadataUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch authorization server metadata: ${response.status}`
        );
      }

      this.authorizationServerMetadata = await response.json();
    } catch (error) {
      console.error('Failed to discover authorization server metadata:', error);
      throw error;
    }
  }

  /**
   * Validate an OAuth access token
   */
  async validateAccessToken(
    token: string
  ): Promise<{ valid: boolean; payload?: any }> {
    // if (!this.authorizationServerMetadata) {
    //   await this.discoverAuthorizationServer();
    // }

    try {
      // TODO(brooks): use introspection endpoint from config / by requesting well-known
      // Use introspection endpoint if available
      // if (this.authorizationServerMetadata.introspection_endpoint) {
      return await this.introspectToken(token);
      // }

      // // Fallback to userinfo endpoint
      // if (this.authorizationServerMetadata.userinfo_endpoint) {
      //   return await this.validateWithUserinfo(token);
      // }

      // throw new Error('No token validation endpoint available');
      return { valid: true };
    } catch (error) {
      console.error('Token validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Introspect token using RFC 7662
   */
  private async introspectToken(
    token: string
  ): Promise<{ valid: boolean; payload?: any }> {
    const response = await fetch(
      // this.authorizationServerMetadata.introspection_endpoint,
      'https://developer.api.autodesk.com/authentication/v2/introspect',
      {
        method: 'POST',
        headers: (() => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
          };
          if (this.config.clientSecret) {
            headers['Authorization'] =
              `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`;
          }
          return headers;
        })(),
        body: new URLSearchParams({
          token,
          token_type_hint: 'access_token',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Introspection failed: ${response.status}`);
    }

    const result: any = await response.json();
    return {
      valid: result.active === true,
      payload: result.active ? result : undefined,
    };
  }

  /**
   * Validate token using userinfo endpoint
   */
  private async validateWithUserinfo(
    token: string
  ): Promise<{ valid: boolean; payload?: any }> {
    const response = await fetch(
      this.authorizationServerMetadata.userinfo_endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return { valid: false };
    }

    const userinfo = await response.json();
    return { valid: true, payload: userinfo };
  }

  /**
   * Middleware to authenticate MCP requests
   */
  async authenticateRequest(
    c: Context
  ): Promise<{ authenticated: boolean; user?: any }> {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }

    const token = authHeader.substring(7);
    const validation = await this.validateAccessToken(token);

    if (!validation.valid) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: validation.payload,
    };
  }

  /**
   * Get OAuth 2.0 Protected Resource Metadata (RFC 9728)
   */
  getResourceMetadata() {
    return {
      resource: this.config.resourceIndicator || 'mcp://server',
      authorization_servers: [this.config.authorizationServerUrl],
      scopes_supported: this.config.scope
        ? [this.config.scope]
        : ['read', 'write'],
      bearer_methods_supported: ['header'],
      resource_documentation: 'MCP Server with OAuth 2.1 authentication',
    };
  }
}

/**
 * Setup OAuth authentication for MCP server
 */
export function setupOAuthProvider<S extends UpstreamMCPServer>(
  _server: S,
  config: OAuthConfig
): ProxyOAuthServerProvider {
  const oauthProvider = new ProxyOAuthServerProvider(config);

  // Initialize the provider
  oauthProvider.discoverAuthorizationServer().catch(console.error);

  return oauthProvider;
}
