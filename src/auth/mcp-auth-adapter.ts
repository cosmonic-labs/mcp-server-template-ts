import { Context, Next, MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { MCPAuth, fetchServerConfig, AuthServerConfig, AuthServerType } from 'mcp-auth';
import type { BearerAuthConfig, VerifyAccessTokenFunction, VerifyAccessTokenMode } from 'mcp-auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface MCPAuthHonoConfig {
  server: AuthServerConfig;
}

export class MCPAuthHono {
  private mcpAuth: MCPAuth;

  constructor(config: MCPAuthHonoConfig) {
    this.mcpAuth = new MCPAuth(config);
  }

  /**
   * Creates a Hono router that serves the OAuth 2.0 Authorization Server Metadata endpoint
   */
  protectedResourceMetadataRouter(): MiddlewareHandler {
    return async (c: Context, next: Next): Promise<Response | void> => {
      // Handle CORS for OAuth metadata endpoint
      if (c.req.path === '/.well-known/oauth-authorization-server') {
        // Set CORS headers for OAuth metadata endpoint
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (c.req.method === 'OPTIONS') {
          return new Response('', { status: 204 });
        }
        
        if (c.req.method === 'GET') {
          // Return the OAuth server metadata
          const serverMetadata = this.mcpAuth.config.server.metadata;
          const metadata = {
            issuer: serverMetadata.issuer,
            authorization_endpoint: serverMetadata.authorizationEndpoint,
            token_endpoint: serverMetadata.tokenEndpoint,
            userinfo_endpoint: serverMetadata.userinfoEndpoint,
            jwks_uri: serverMetadata.jwksUri,
            scopes_supported: serverMetadata.scopeSupported,
            response_types_supported: serverMetadata.responseTypesSupported || ['code'],
            grant_types_supported: serverMetadata.grantTypesSupported || ['authorization_code'],
            token_endpoint_auth_methods_supported: serverMetadata.tokenEndpointAuthMethodsSupported || ['client_secret_basic'],
          };
          
          return c.json(metadata);
        }
        
        // Return 405 for unsupported methods
        return c.json({ error: 'Method not allowed' }, 405);
      }
      
      return next();
    };
  }

  /**
   * Creates a Bearer auth middleware that verifies the access token
   */
  bearerAuth(
    verifyAccessToken: VerifyAccessTokenFunction,
    config?: Omit<BearerAuthConfig, 'verifyAccessToken' | 'issuer'>
  ): MiddlewareHandler;
  bearerAuth(
    mode: VerifyAccessTokenMode,
    config?: Omit<BearerAuthConfig, 'verifyAccessToken' | 'issuer'> & {
      jwtVerify?: any;
      remoteJwkSet?: any;
    }
  ): MiddlewareHandler;
  bearerAuth(
    verifyOrMode: VerifyAccessTokenFunction | VerifyAccessTokenMode,
    config?: any
  ): MiddlewareHandler {
    return async (c: Context, next: Next) => {
      const authHeader = c.req.header('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized', message: 'Bearer token required' }, 401);
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix

      try {
        let authInfo;
        
        if (typeof verifyOrMode === 'function') {
          // Custom verify function
          authInfo = await verifyOrMode(token);
        } else if (verifyOrMode === 'jwt') {
          // JWT verification mode - use jose library directly
          const serverMetadata = this.mcpAuth.config.server.metadata;
          
          if (!serverMetadata.jwksUri) {
            throw new Error('JWKS URI not available for JWT verification');
          }
          
          const JWKS = createRemoteJWKSet(new URL(serverMetadata.jwksUri), config?.remoteJwkSet);
          const { payload } = await jwtVerify(token, JWKS, {
            issuer: serverMetadata.issuer,
            ...config?.jwtVerify,
          });
          
          // Convert payload to AuthInfo format expected by mcp-auth
          const scopes = payload.scope 
            ? (payload.scope as string).split(' ')
            : (payload.scopes as string[] || []);
          
          authInfo = {
            subject: payload.sub,
            issuer: payload.iss!,
            clientId: payload.client_id as string || payload.azp as string || payload.aud as string,
            scopes,
            audience: payload.aud as string | string[],
            token: token,
            claims: payload as Record<string, unknown>,
            expiresAt: payload.exp ? payload.exp * 1000 : undefined, // Convert to milliseconds
          };
        } else {
          throw new Error('Invalid verification mode');
        }

        // Check required scopes if specified
        if (config?.requiredScopes && authInfo.scopes) {
          const hasRequiredScopes = config.requiredScopes.every((scope: string) => 
            authInfo.scopes.includes(scope)
          );
          
          if (!hasRequiredScopes) {
            return c.json({ 
              error: 'Forbidden', 
              message: 'Insufficient scope',
              required_scopes: config.requiredScopes,
              token_scopes: authInfo.scopes
            }, 403);
          }
        }

        // Add auth info to context
        c.set('auth', authInfo);
        c.set('authInfo', authInfo); // For compatibility

        return next();
      } catch (error) {
        console.error('Token verification failed:', error);
        return c.json({ 
          error: 'Unauthorized', 
          message: 'Invalid or expired token' 
        }, 401);
      }
    };
  }
}

/**
 * Fetches server configuration automatically by providing the issuer URL
 * and server type.
 */
export async function fetchServerConfigForHono(
  issuer: string,
  config: { type: AuthServerType; transpileData?: (data: object) => any }
): Promise<AuthServerConfig> {
  return fetchServerConfig(issuer, config);
}

/**
 * Helper to create MCPAuthHono instance with automatic server config fetching
 */
export async function createMCPAuthHono(
  issuerUrl: string,
  serverType: AuthServerType = 'oidc',
  transpileData?: (data: object) => any
): Promise<MCPAuthHono> {
  const config: { type: AuthServerType; transpileData?: (data: object) => any } = {
    type: serverType,
  };
  
  if (transpileData) {
    config.transpileData = transpileData;
  }
  
  const serverConfig = await fetchServerConfigForHono(issuerUrl, config);

  return new MCPAuthHono({ server: serverConfig });
}

export { MCPAuth, fetchServerConfig };
export type { AuthServerConfig, AuthServerType, BearerAuthConfig, VerifyAccessTokenFunction };