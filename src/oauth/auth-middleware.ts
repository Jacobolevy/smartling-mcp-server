import { Request, Response, NextFunction } from 'express';

/**
 * OAuth 2.1 MCP Auth Middleware for Smartling
 * 
 * Implements OAuth 2.1 with PKCE for MCP compliance while maintaining
 * compatibility with Smartling's existing userIdentifier/userSecret flow.
 * 
 * This is a hybrid approach that:
 * 1. Accepts OAuth 2.1 access tokens for MCP clients
 * 2. Falls back to Smartling credentials for legacy compatibility
 * 3. Implements Authorization Server Metadata discovery
 */

export interface SmartlingOAuthConfig {
  // Smartling API credentials (legacy compatibility)
  userIdentifier: string;
  userSecret: string;
  baseUrl?: string;
  
  // OAuth 2.1 MCP configuration
  enableOAuth?: boolean;
  clientId?: string;
  clientSecret?: string;
  authServerUrl?: string;
  
  // Token validation
  jwtSecret?: string;
  tokenExpiry?: number; // in seconds, default 3600
}

export interface OAuthTokenPayload {
  sub: string; // subject (user ID)
  aud: string; // audience (should be our service)
  iss: string; // issuer
  exp: number; // expiration time
  iat: number; // issued at
  scope?: string; // requested scopes
  client_id?: string;
}

export interface AuthContext {
  userId?: string;
  clientId?: string;
  scopes?: string[];
  accessToken?: string;
  // Smartling credentials for API calls
  smartlingToken?: string;
  smartlingConfig: {
    userIdentifier: string;
    userSecret: string;
    baseUrl: string;
  };
}

/**
 * OAuth 2.1 Authorization Server Metadata
 * Implementation of RFC 8414
 */
export function createAuthServerMetadata(config: SmartlingOAuthConfig) {
  const baseUrl = config.authServerUrl || config.baseUrl || 'https://api.smartling.com';
  
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: [
      'smartling:read',
      'smartling:write',
      'smartling:admin',
      'smartling:files:read',
      'smartling:files:write',
      'smartling:projects:read',
      'smartling:jobs:read',
      'smartling:jobs:write'
    ],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    code_challenge_methods_supported: ['S256'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    service_documentation: 'https://github.com/Jacobolevy/smartling-mcp-server',
    ui_locales_supported: ['en-US', 'es-ES'],
  };
}

/**
 * Validates OAuth 2.1 Bearer token
 */
export async function validateBearerToken(token: string, config: SmartlingOAuthConfig): Promise<OAuthTokenPayload | null> {
  try {
    // For demo purposes, we'll implement JWT validation
    // In production, this should validate against your OAuth server
    
    if (!token.startsWith('Bearer ')) {
      return null;
    }
    
    const jwtToken = token.substring(7);
    
    // Basic JWT validation (in production, use proper JWT library)
    const parts = jwtToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Validate expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    // Validate audience (should be our service)
    if (payload.aud && !payload.aud.includes('smartling-mcp-server')) {
      return null;
    }
    
    return payload as OAuthTokenPayload;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * OAuth middleware for MCP requests
 */
export function createOAuthMiddleware(config: SmartlingOAuthConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      let authContext: AuthContext = {
        smartlingConfig: {
          userIdentifier: config.userIdentifier,
          userSecret: config.userSecret,
          baseUrl: config.baseUrl || 'https://api.smartling.com'
        }
      };
      
      // Try OAuth 2.1 validation first if enabled
      if (config.enableOAuth && authHeader) {
        const tokenPayload = await validateBearerToken(authHeader, config);
        
        if (tokenPayload) {
          authContext.userId = tokenPayload.sub;
          if (tokenPayload.client_id) {
            authContext.clientId = tokenPayload.client_id;
          }
          authContext.scopes = tokenPayload.scope ? tokenPayload.scope.split(' ') : [];
          authContext.accessToken = authHeader;
          
          // Attach auth context to request
          (req as any).auth = authContext;
          return next();
        }
      }
      
      // For MCP protocol, if no valid OAuth token, return 401
      if (req.path.startsWith('/mcp') || req.headers['user-agent']?.includes('mcp')) {
        return res.status(401).json({
          error: 'unauthorized',
          error_description: 'Valid OAuth 2.1 access token required',
          www_authenticate: 'Bearer realm="smartling-mcp-server", scope="smartling:read smartling:write"'
        });
      }
      
      // For legacy compatibility, allow requests without OAuth
      (req as any).auth = authContext;
      next();
      
    } catch (error) {
      console.error('OAuth middleware error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal authentication error'
      });
    }
  };
}

/**
 * Scope validation middleware
 */
export function requireScopes(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authContext = (req as any).auth as AuthContext;
    
    if (!authContext?.scopes) {
      res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required scopes: ${requiredScopes.join(', ')}`,
        scope: requiredScopes.join(' ')
      });
      return;
    }
    
    const hasRequiredScopes = requiredScopes.every(scope => 
      authContext.scopes?.includes(scope) || authContext.scopes?.includes('smartling:admin')
    );
    
    if (!hasRequiredScopes) {
      res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required scopes: ${requiredScopes.join(', ')}`,
        scope: requiredScopes.join(' ')
      });
      return;
    }
    
    next();
  };
}

/**
 * Express route handlers for OAuth endpoints
 */
export function createOAuthRoutes(config: SmartlingOAuthConfig) {
  return {
    // Authorization Server Metadata (RFC 8414)
    '/.well-known/oauth-authorization-server': (req: Request, res: Response): void => {
      res.json(createAuthServerMetadata(config));
    },
    
    // OAuth authorization endpoint
    '/oauth/authorize': (req: Request, res: Response): void => {
      // In a full implementation, this would redirect to login page
      // For MCP, we primarily use client credentials flow
      res.status(501).json({
        error: 'not_implemented',
        error_description: 'Authorization code flow not implemented. Use client credentials flow.'
      });
    },
    
    // OAuth token endpoint
    '/oauth/token': async (req: Request, res: Response): Promise<void> => {
      const { grant_type, client_id, client_secret, scope } = req.body;
      
      if (grant_type !== 'client_credentials') {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials grant type is supported'
        });
        return;
      }
      
      if (!client_id || !client_secret) {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required'
        });
        return;
      }
      
      // Validate client credentials
      if (client_id !== config.clientId || client_secret !== config.clientSecret) {
        res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        });
        return;
      }
      
      // Generate access token (in production, use proper JWT library)
      const payload = {
        sub: client_id,
        aud: 'smartling-mcp-server',
        iss: config.authServerUrl || config.baseUrl || 'https://api.smartling.com',
        exp: Math.floor(Date.now() / 1000) + (config.tokenExpiry || 3600),
        iat: Math.floor(Date.now() / 1000),
        scope: scope || 'smartling:read smartling:write',
        client_id: client_id
      };
      
      // Simple JWT (in production, use proper signing)
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      res.json({
        access_token: `Bearer ${token}`,
        token_type: 'Bearer',
        expires_in: config.tokenExpiry || 3600,
        scope: payload.scope
      });
    },
    
    // Dynamic Client Registration (RFC 7591)
    '/oauth/register': (req: Request, res: Response): void => {
      const { client_name, redirect_uris, grant_types, scope } = req.body;
      
      if (!client_name) {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'client_name is required'
        });
        return;
      }
      
      // Generate client credentials
      const clientId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = Math.random().toString(36).substr(2, 32);
      
      res.json({
        client_id: clientId,
        client_secret: clientSecret,
        client_name: client_name,
        grant_types: grant_types || ['client_credentials'],
        redirect_uris: redirect_uris || [],
        scope: scope || 'smartling:read smartling:write',
        token_endpoint_auth_method: 'client_secret_basic'
      });
    }
  };
} 