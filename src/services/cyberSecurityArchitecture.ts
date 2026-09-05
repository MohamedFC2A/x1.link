/**
 * ============================================================================
 * FATHOM CYBER: SOVEREIGN CYBERSECURITY ARCHITECTURE ENGINE
 * Reference Implementations & Enforcement Primitives for RFC 9449 DPoP,
 * Edge Gateway URI Sanitization, DoS-Resilient JWKS, and Zero-Trust Kafka
 * ============================================================================
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// 1. DPoP KEY ARCHITECTURE & VERIFICATION (RFC 9449 & RFC 7638)
// ─────────────────────────────────────────────────────────────────────────────

export interface CanonicalJWK {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  e?: string;
  n?: string;
  alg?: string;
  use?: string;
  kid?: string;
  [key: string]: any;
}

export interface DPoPProofHeader {
  typ: string; // Must be "dpop+jwt"
  alg: string; // e.g. "ES256", "RS256"
  jwk: CanonicalJWK; // Embedded ephemeral client public key ONLY
}

export interface DPoPProofPayload {
  jti: string; // Unique per-proof token ID
  htm: string; // HTTP Method (e.g. "POST", "GET")
  htu: string; // HTTP Target URI (Normalized string without query/fragment)
  iat: number; // Issued at timestamp (seconds)
  nonce?: string; // Server-provided nonce
  ath?: string; // Hash of access token if bound
  [key: string]: any;
}

export interface DPoPVerificationResult {
  valid: boolean;
  jkt: string;
  error?: string;
  header?: DPoPProofHeader;
  payload?: DPoPProofPayload;
}

export class DPoPValidator {
  /**
   * RFC 7638: Computes canonical SHA-256 JWK thumbprint (jkt).
   * Strict lexicographical sorting of required members with zero whitespace:
   * - RSA: ["e", "kty", "n"]
   * - EC:  ["crv", "kty", "x", "y"]
   * - OKP: ["crv", "kty", "x"]
   */
  public static computeCanonicalJkt(jwk: CanonicalJWK): string {
    if (!jwk || typeof jwk !== 'object') {
      throw new Error('Invalid JWK object provided for thumbprint computation');
    }

    let canonicalMembers: Record<string, string>;

    if (jwk.kty === 'RSA') {
      if (!jwk.e || !jwk.n) throw new Error('Malformed RSA JWK: missing e or n');
      canonicalMembers = {
        e: jwk.e,
        kty: jwk.kty,
        n: jwk.n
      };
    } else if (jwk.kty === 'EC') {
      if (!jwk.crv || !jwk.x || !jwk.y) throw new Error('Malformed EC JWK: missing crv, x, or y');
      canonicalMembers = {
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x,
        y: jwk.y
      };
    } else if (jwk.kty === 'OKP') {
      if (!jwk.crv || !jwk.x) throw new Error('Malformed OKP JWK: missing crv or x');
      canonicalMembers = {
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x
      };
    } else {
      throw new Error(`Unsupported JWK key type for canonical thumbprint: ${jwk.kty}`);
    }

    // Strict lexicographical sorting of required members (RFC 7638 Section 3)
    const sortedMembers: Record<string, string> = {};
    for (const key of Object.keys(canonicalMembers).sort()) {
      sortedMembers[key] = canonicalMembers[key];
    }
    const canonicalJson = JSON.stringify(sortedMembers);
    const hash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest();
    return hash.toString('base64url');
  }

  /**
   * Validates DPoP proof without external JWKS lookup.
   * Cryptographically validates signature directly against embedded `jwk` JOSE header.
   * Enforces key-binding against access token's `cnf.jkt` claim.
   */
  public static verifyProof(params: {
    dpopProofJwt: string;
    expectedHtm: string;
    expectedHtu: string;
    expectedCnfJkt?: string;
    expectedNonce?: string;
    expectedAccessToken?: string;
    clockToleranceSeconds?: number;
    maxValiditySeconds?: number;
  }): DPoPVerificationResult {
    const {
      dpopProofJwt,
      expectedHtm,
      expectedHtu,
      expectedCnfJkt,
      expectedNonce,
      expectedAccessToken,
      clockToleranceSeconds = 5,
      maxValiditySeconds = 300
    } = params;

    if (!expectedHtm || typeof expectedHtm !== 'string') {
      return { valid: false, jkt: '', error: 'Expected HTTP method (htm) is required' };
    }

    if (!expectedHtu || typeof expectedHtu !== 'string') {
      return { valid: false, jkt: '', error: 'Expected HTTP target URI (htu) is required' };
    }

    if (!dpopProofJwt || typeof dpopProofJwt !== 'string') {
      return { valid: false, jkt: '', error: 'DPoP proof JWT missing or invalid' };
    }

    const parts = dpopProofJwt.split('.');
    if (parts.length !== 3) {
      return { valid: false, jkt: '', error: 'Malformed JWT structure in DPoP proof' };
    }

    let header: DPoPProofHeader;
    let payload: DPoPProofPayload;

    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      return { valid: false, jkt: '', error: 'Failed to decode DPoP header or payload' };
    }

    if (!header || typeof header !== 'object' || Array.isArray(header)) {
      return { valid: false, jkt: '', error: 'Malformed DPoP header' };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, jkt: '', error: 'Malformed DPoP payload' };
    }

    // 1. Strict header validation (RFC 9449 section 4.2)
    if (header.typ?.toLowerCase() !== 'dpop+jwt') {
      return { valid: false, jkt: '', error: `Invalid typ header: expected dpop+jwt, got ${header.typ}` };
    }

    if (!header.alg) {
      return { valid: false, jkt: '', error: 'Missing alg in DPoP header' };
    }

    // RFC 9449 Section 4.2: Header MUST NOT contain external key directives
    const prohibitedHeaders = ['jku', 'x5u', 'x5c', 'x5t', 'x5t#S256'];
    for (const param of prohibitedHeaders) {
      if ((header as any)[param] !== undefined) {
        return {
          valid: false,
          jkt: '',
          error: `RFC 9449 security violation: DPoP header MUST NOT contain prohibited parameter '${param}'`
        };
      }
    }

    if (!header.jwk || typeof header.jwk !== 'object') {
      return { valid: false, jkt: '', error: 'DPoP proof MUST contain embedded public jwk in header' };
    }

    // Ensure embedded JWK contains NO private key material (d, p, q, dp, dq, qi, oth)
    const privateParams = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'];
    for (const param of privateParams) {
      if (header.jwk[param] !== undefined) {
        return { valid: false, jkt: '', error: `Security violation: embedded JWK contains private key material (${param})` };
      }
    }

    // 2. Compute canonical JKT from embedded public key
    let jkt = '';
    try {
      jkt = this.computeCanonicalJkt(header.jwk);
    } catch (err: any) {
      return { valid: false, jkt: '', error: `Failed to compute canonical jkt: ${err.message}` };
    }

    // 3. Cryptographic Key Binding Assertion
    if (expectedCnfJkt && jkt !== expectedCnfJkt) {
      return {
        valid: false,
        jkt,
        error: `Cryptographic key-binding mismatch: proof jkt (${jkt}) does not match token cnf.jkt (${expectedCnfJkt})`
      };
    }

    // 4. Verify Payload Claims (htm, htu, iat, nonce, ath)
    if (!payload.jti) {
      return { valid: false, jkt, error: 'Missing jti claim in DPoP proof payload' };
    }

    if (payload.htm?.toUpperCase() !== expectedHtm.toUpperCase()) {
      return {
        valid: false,
        jkt,
        error: `HTM mismatch: proof has ${payload.htm}, expected ${expectedHtm}`
      };
    }

    const normalizedExpectedHtu = GatewayUriNormalizer.normalizeUri(expectedHtu);
    const normalizedProofHtu = GatewayUriNormalizer.normalizeUri(payload.htu);
    if (normalizedProofHtu !== normalizedExpectedHtu) {
      return {
        valid: false,
        jkt,
        error: `HTU mismatch: proof has ${payload.htu}, expected ${expectedHtu}`
      };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.iat > nowSec + clockToleranceSeconds) {
      return { valid: false, jkt, error: 'DPoP proof iat is in the future' };
    }

    if (nowSec - payload.iat > maxValiditySeconds + clockToleranceSeconds) {
      return { valid: false, jkt, error: 'DPoP proof expired (iat older than allowed window)' };
    }

    if (expectedNonce && payload.nonce !== expectedNonce) {
      return {
        valid: false,
        jkt,
        error: `DPoP nonce mismatch: proof has ${payload.nonce || 'none'}, expected ${expectedNonce}`
      };
    }

    if (expectedAccessToken) {
      const expectedAth = crypto.createHash('sha256').update(expectedAccessToken, 'ascii').digest('base64url');
      if (payload.ath !== expectedAth) {
        return {
          valid: false,
          jkt,
          error: `Access token hash (ath) mismatch: proof has '${payload.ath || 'none'}', expected '${expectedAth}'`
        };
      }
    }

    // 5. Cryptographic Signature Verification using embedded JWK
    try {
      const isSignatureValid = this.verifyJwtSignatureWithJwk(parts[0], parts[1], parts[2], header);
      if (!isSignatureValid) {
        return { valid: false, jkt, error: 'Cryptographic signature verification failed on embedded JWK' };
      }
    } catch (err: any) {
      return { valid: false, jkt, error: `Signature verification exception: ${err.message}` };
    }

    return {
      valid: true,
      jkt,
      header,
      payload
    };
  }

  /**
   * Validates signature using Node.js crypto and the embedded JWK without external lookups.
   * Supports RS256/384/512, PS256/384/512 (RSA-PSS), ES256/384/512 (ECDSA), and EdDSA.
   */
  private static verifyJwtSignatureWithJwk(
    headerB64: string,
    payloadB64: string,
    signatureB64: string,
    header: DPoPProofHeader
  ): boolean {
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');
    const keyObject = crypto.createPublicKey({
      key: header.jwk,
      format: 'jwk'
    });

    const alg = header.alg;

    if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
      const hashAlgoMap: Record<string, string> = {
        RS256: 'RSA-SHA256',
        RS384: 'RSA-SHA384',
        RS512: 'RSA-SHA512'
      };
      const verifier = crypto.createVerify(hashAlgoMap[alg]);
      verifier.update(signingInput);
      return verifier.verify(keyObject, signature);
    } else if (alg === 'PS256' || alg === 'PS384' || alg === 'PS512') {
      const hashAlgoMap: Record<string, string> = {
        PS256: 'RSA-SHA256',
        PS384: 'RSA-SHA384',
        PS512: 'RSA-SHA512'
      };
      return crypto.verify(
        hashAlgoMap[alg],
        Buffer.from(signingInput),
        {
          key: keyObject,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        },
        signature
      );
    } else if (alg === 'ES256' || alg === 'ES384' || alg === 'ES512') {
      const hashAlgoMap: Record<string, string> = {
        ES256: 'SHA256',
        ES384: 'SHA384',
        ES512: 'SHA512'
      };
      const verifier = crypto.createVerify(hashAlgoMap[alg]);
      verifier.update(signingInput);
      return verifier.verify(
        {
          key: keyObject,
          dsaEncoding: 'ieee-p1363'
        },
        signature
      );
    } else if (alg === 'EdDSA') {
      return crypto.verify(null, Buffer.from(signingInput), keyObject, signature);
    }

    throw new Error(`Unsupported DPoP signing algorithm: ${alg}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATELESS DPoP-NONCE HANDSHAKE & GATEWAY PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────

export interface NonceValidationResult {
  valid: boolean;
  clientIp?: string;
  timestamp?: number;
  error?: string;
}

export class StatelessDPoPNonceManager {
  private readonly gatewayKey: Buffer;
  private readonly windowSeconds: number;

  constructor(gatewaySecret: string, windowSeconds: number = 60) {
    if (!gatewaySecret || gatewaySecret.length < 16) {
      throw new Error('Gateway secret key must be at least 16 characters for cryptographic HMAC');
    }
    this.gatewayKey = crypto.createHash('sha256').update(gatewaySecret).digest();
    this.windowSeconds = windowSeconds;
  }

  /**
   * Generates stateless, cryptographically signed nonce:
   * Nonce = Base64URL(payload || ":" || HMAC-SHA256(payload))
   * where payload = client_ip || ":" || timestamp || ":" || entropy
   */
  public generateNonce(clientIp: string, customTimestampSec?: number): string {
    if (!clientIp || typeof clientIp !== 'string') {
      throw new Error('Client IP string is required for nonce generation');
    }
    const timestamp = customTimestampSec ?? Math.floor(Date.now() / 1000);
    const entropy = crypto.randomBytes(16).toString('hex');
    const sanitizedIp = clientIp.replace(/:/g, '_'); // sanitize IPv6 colons
    const payload = `${sanitizedIp}:${timestamp}:${entropy}`;

    const hmac = crypto
      .createHmac('sha256', this.gatewayKey)
      .update(payload)
      .digest('base64url');

    const rawNonce = `${payload}:${hmac}`;
    return Buffer.from(rawNonce).toString('base64url');
  }

  /**
   * Verifies stateless nonce without distributed key-value store lookup.
   * Checks HMAC integrity, client IP binding, and temporal window.
   */
  public verifyNonce(nonceString: string, clientIp: string): NonceValidationResult {
    if (!nonceString || typeof nonceString !== 'string') {
      return { valid: false, error: 'Missing nonce' };
    }
    if (!clientIp || typeof clientIp !== 'string') {
      return { valid: false, error: 'Missing or invalid client IP' };
    }

    let decoded = '';
    try {
      decoded = Buffer.from(nonceString, 'base64url').toString('utf8');
    } catch {
      return { valid: false, error: 'Malformed base64url nonce encoding' };
    }

    const parts = decoded.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid nonce payload segmentation' };
    }

    const [nonceIp, timestampStr, entropy, signature] = parts;
    const payload = `${nonceIp}:${timestampStr}:${entropy}`;

    // Constant-time HMAC comparison to prevent timing attacks
    const expectedHmac = crypto
      .createHmac('sha256', this.gatewayKey)
      .update(payload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedHmac, 'utf8');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: 'Cryptographic signature mismatch on nonce' };
    }

    const sanitizedIp = clientIp.replace(/:/g, '_');
    if (nonceIp !== sanitizedIp) {
      return {
        valid: false,
        error: `Client IP binding mismatch: nonce issued to ${nonceIp}, presented by ${sanitizedIp}`
      };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return { valid: false, error: 'Corrupt timestamp in nonce payload' };
    }

    const now = Math.floor(Date.now() / 1000);
    // Allow current window or immediately preceding temporal window (2 * windowSeconds)
    if (now < timestamp - 5) {
      return { valid: false, error: 'Nonce timestamp is in the future' };
    }

    if (now - timestamp > this.windowSeconds * 2) {
      return { valid: false, error: 'DPoP nonce expired (exceeded valid rotation interval)' };
    }

    return {
      valid: true,
      clientIp,
      timestamp
    };
  }

  /**
   * HTTP 401 challenge response generator with DPoP-Nonce header
   */
  public create401Challenge(clientIp: string): {
    statusCode: 401;
    headers: Record<string, string>;
    body: { error: string; error_description: string };
  } {
    const freshNonce = this.generateNonce(clientIp);
    return {
      statusCode: 401,
      headers: {
        'DPoP-Nonce': freshNonce,
        'WWW-Authenticate': 'DPoP error="use_dpop_nonce", error_description="Authorization requires a fresh DPoP nonce"',
        'Access-Control-Expose-Headers': 'DPoP-Nonce'
      },
      body: {
        error: 'use_dpop_nonce',
        error_description: 'Authorization server requires DPoP proof bound to fresh DPoP-Nonce'
      }
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GATEWAY-LEVEL URI NORMALIZATION & ENVOY HARDENING
// ─────────────────────────────────────────────────────────────────────────────

export interface EnvoyHttpConnectionManagerConfig {
  normalize_path: boolean;
  merge_slashes: boolean;
  path_with_escaped_slashes_action: 'UNESCAPE_AND_REDIRECT' | 'UNESCAPE_AND_FORWARD' | 'REJECT_REQUEST';
}

export class GatewayUriNormalizer {
  /**
   * Envoy HTTP Connection Manager Security Configuration (RFC 3986 Path Sanitization)
   */
  public static getEnvoySanitizationConfig(): EnvoyHttpConnectionManagerConfig {
    return {
      normalize_path: true,
      merge_slashes: true,
      path_with_escaped_slashes_action: 'UNESCAPE_AND_REDIRECT'
    };
  }

  /**
   * Generates Envoy YAML snippet for http_connection_manager
   */
  public static generateEnvoyConfigSnippet(): string {
    return `
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
  stat_prefix: ingress_http
  normalize_path: true
  merge_slashes: true
  path_with_escaped_slashes_action: UNESCAPE_AND_REDIRECT
  route_config:
    name: local_route
    virtual_hosts:
    - name: backend_services
      domains: ["*"]
`.trim();
  }

  /**
   * Algorithmic Gateway URI Normalization:
   * 1. Strips matrix parameters (;params)
   * 2. Resolves and unescapes %2F, %2E%2E traversals
   * 3. Collapses dot segments (/../ and /./)
   * 4. Merges repeated slashes (//+ -> /)
   * 5. Strips query string and fragment for canonical HTU matching
   */
  public static normalizeUri(rawUri: string): string {
    if (!rawUri || typeof rawUri !== 'string') return '';

    let uri = rawUri.trim();

    // Separate scheme + host from path if absolute URL
    let origin = '';
    try {
      const parsed = new URL(uri);
      origin = `${parsed.protocol}//${parsed.host}`;
      uri = parsed.pathname;
    } catch {
      // Relative path - strip query/fragment if present
      const queryIdx = uri.indexOf('?');
      if (queryIdx !== -1) uri = uri.substring(0, queryIdx);
      const hashIdx = uri.indexOf('#');
      if (hashIdx !== -1) uri = uri.substring(0, hashIdx);
    }

    // Step 0: Normalize percent-encoded semicolons (%3b / %3B) before matrix stripping
    uri = uri.replace(/%3b/gi, ';');

    // Step 1: Strip matrix parameters (e.g. /path;jsessionid=123)
    uri = uri.replace(/;[^/]*($|\/)/g, '$1');

    // Step 2: Iteratively unescape percent-encoded slashes and dots (%2F, %2e)
    uri = uri.replace(/%2f/gi, '/').replace(/%2e/gi, '.');

    // Step 3: Merge multiple slashes (//+) -> /
    uri = uri.replace(/\/+/g, '/');

    // Step 4: RFC 3986 Section 5.2.4 Remove Dot Segments
    const segments = uri.split('/');
    const outputSegments: string[] = [];

    for (const segment of segments) {
      if (segment === '' || segment === '.') {
        continue;
      }
      if (segment === '..') {
        outputSegments.pop();
      } else {
        outputSegments.push(segment);
      }
    }

    const normalizedPath = '/' + outputSegments.join('/');
    return origin ? `${origin}${normalizedPath}` : normalizedPath;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. JWKS CACHE STAMPEDE DEFENSE & SSRF-PROOF REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantJwksRecord {
  tenantId: string;
  jwksUrl: string; // Strictly from internal immutable config
  allowedIssuers: string[];
}

export class SingleflightJwksResolver {
  private readonly tenantRegistry: Map<string, TenantJwksRecord>;
  private readonly inFlightRequests: Map<string, Promise<any[]>> = new Map();
  private readonly memoryCache: Map<string, { keys: any[]; expiresAt: number }> = new Map();
  private readonly lastFetchTimestamps: Map<string, number> = new Map();
  private readonly rateLimitWindowMs: number;

  constructor(
    immutableTenantConfig: TenantJwksRecord[],
    rateLimitWindowMs: number = 10000 // 1 outbound fetch per 10s per tenant
  ) {
    this.tenantRegistry = new Map(immutableTenantConfig.map(t => [t.tenantId, t]));
    this.rateLimitWindowMs = rateLimitWindowMs;
  }

  /**
   * Request Coalescing (Singleflight Pattern) with Deterministic Rate Limiting
   * Prevents cache stampede and DoS key exhaustion.
   * Strictly resolves JWKS from internal ConfigMap to prevent SSRF.
   */
  public async getJwksKey(
    tenantId: string,
    kid: string,
    mockFetchFn?: (url: string) => Promise<any[]>
  ): Promise<{ key: any; fromCache: boolean }> {
    // 1. Immutable Tenant Registry Lookup (Eliminates SSRF via jku / unvalidated iss)
    const tenantConfig = this.tenantRegistry.get(tenantId);
    if (!tenantConfig) {
      throw new Error(`Security Violation: Unregistered tenant ID '${tenantId}'. Dynamic JKU / ISS is rejected (SSRF Prevention).`);
    }

    // 2. Cache Inspection
    const cacheKey = `jwks:${tenantId}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const match = cached.keys.find(k => k.kid === kid);
      if (match) {
        return { key: match, fromCache: true };
      }
    }

    // 3. Singleflight Request Coalescing per Tenant
    const flightKey = tenantId;
    let fetchPromise = this.inFlightRequests.get(flightKey);

    if (!fetchPromise) {
      // 4. Deterministic Rate-Limiting per Tenant (evaluated only when initiating a new fetch)
      const lastFetch = this.lastFetchTimestamps.get(tenantId) || 0;
      const now = Date.now();
      if (now - lastFetch < this.rateLimitWindowMs) {
        const remainingCooldown = Math.ceil((this.rateLimitWindowMs - (now - lastFetch)) / 1000);
        throw new Error(`Rate Limit Exceeded: JWKS fetch throttled for tenant '${tenantId}'. Try again in ${remainingCooldown}s.`);
      }

      this.lastFetchTimestamps.set(tenantId, now);

      // 5. Execute Outbound Fetch through Singleflight Guard
      fetchPromise = (async () => {
        try {
          let keys: any[];
          if (mockFetchFn) {
            keys = await mockFetchFn(tenantConfig.jwksUrl);
          } else {
            const resp = await fetch(tenantConfig.jwksUrl, {
              headers: { Accept: 'application/json' }
            });
            if (!resp.ok) throw new Error(`Upstream JWKS HTTP ${resp.status}`);
            const data = await resp.json();
            keys = data.keys || [];
          }

          // Cache keys for 5 minutes
          this.memoryCache.set(cacheKey, {
            keys,
            expiresAt: Date.now() + 300000
          });

          return keys;
        } finally {
          this.inFlightRequests.delete(flightKey);
        }
      })();

      this.inFlightRequests.set(flightKey, fetchPromise);
    }

    const resolvedKeys = await fetchPromise;
    const matchedKey = resolvedKeys.find((k: any) => k.kid === kid);

    if (!matchedKey) {
      throw new Error(`Key ID '${kid}' not found in retrieved JWKS for tenant '${tenantId}'`);
    }

    return { key: matchedKey, fromCache: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ZERO-TRUST KAFKA MULTI-TENANCY (CLIENT-SIDE ENVELOPE ENCRYPTION)
// ─────────────────────────────────────────────────────────────────────────────

export interface KafkaRecordHeader {
  key: string;
  value: string;
}

export interface EncryptedKafkaMessage {
  tenantId: string;
  encryptedPayload: string; // Base64 ciphertext
  iv: string; // Base64 96-bit AES-GCM IV
  authTag: string; // Base64 128-bit authentication tag
  encryptedDek: string; // DEK wrapped by isolated Tenant KMS KEK
  headers: KafkaRecordHeader[];
}

export class KafkaZeroTrustEnvelopeEncryptor {
  private readonly tenantKmsMasterKeys: Map<string, Buffer>;
  private readonly ingressSigningKey: Buffer;

  constructor(
    tenantKmsSecrets: Record<string, string>,
    ingressSecret: string
  ) {
    this.tenantKmsMasterKeys = new Map();
    for (const [tenant, secret] of Object.entries(tenantKmsSecrets)) {
      this.tenantKmsMasterKeys.set(tenant, crypto.createHash('sha256').update(secret).digest());
    }
    this.ingressSigningKey = crypto.createHash('sha256').update(ingressSecret).digest();
  }

  /**
   * Producer-Side Client Envelope Encryption (Field-Level KMS Encryption):
   * 1. Generates single-use 256-bit AES-GCM Data Encryption Key (DEK).
   * 2. Encrypts payload with DEK.
   * 3. Wraps DEK with isolated Tenant KMS Master Key (KEK).
   * 4. Signs metadata in Kafka record headers via Ingress key.
   */
  public encryptRecord(
    tenantId: string,
    plaintextPayload: string
  ): EncryptedKafkaMessage {
    const kek = this.tenantKmsMasterKeys.get(tenantId);
    if (!kek) {
      throw new Error(`KMS Authorization Failure: No isolated KMS master key for tenant '${tenantId}'`);
    }

    // Step 1: Ephemeral 256-bit DEK
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12); // 96-bit GCM IV

    // Step 2: Encrypt Payload with DEK (AES-256-GCM)
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    let ciphertext = cipher.update(plaintextPayload, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    // Step 3: Wrap DEK with Tenant KMS KEK (AES-256-GCM Key Wrapping)
    const dekIv = crypto.randomBytes(12);
    const dekCipher = crypto.createCipheriv('aes-256-gcm', kek, dekIv);
    let wrappedDek = dekCipher.update(dek.toString('base64'), 'utf8', 'base64');
    wrappedDek += dekCipher.final('base64');
    const dekAuthTag = dekCipher.getAuthTag().toString('base64');

    const encryptedDekComposite = `${dekIv.toString('base64')}:${wrappedDek}:${dekAuthTag}`;

    // Step 4: Cryptographically Sign Tenant Record Headers
    const timestamp = Date.now().toString();
    const payloadHash = crypto.createHash('sha256').update(ciphertext).digest('hex');
    const headerPayload = `tenant=${tenantId}&ts=${timestamp}&hash=${payloadHash}`;
    const headerSignature = crypto
      .createHmac('sha256', this.ingressSigningKey)
      .update(headerPayload)
      .digest('base64url');

    const headers: KafkaRecordHeader[] = [
      { key: 'x-tenant-id', value: tenantId },
      { key: 'x-timestamp', value: timestamp },
      { key: 'x-payload-hash', value: payloadHash },
      { key: 'x-ingress-signature', value: headerSignature }
    ];

    return {
      tenantId,
      encryptedPayload: ciphertext,
      iv: iv.toString('base64'),
      authTag,
      encryptedDek: encryptedDekComposite,
      headers
    };
  }

  /**
   * Consumer-Side Local Decryption:
   * Cross-tenant or unauthorized consumers reading off partition receive ONLY ciphertext.
   * Cryptographically asserts header authenticity before decrypting.
   */
  public decryptRecord(
    consumerTenantContext: string,
    message: EncryptedKafkaMessage
  ): string {
    if (!message || typeof message !== 'object') {
      throw new Error('Kafka Zero-Trust Failure: Invalid encrypted message structure');
    }

    if (!Array.isArray(message.headers)) {
      throw new Error('Kafka Zero-Trust Failure: Missing or invalid record headers');
    }

    // 1. Ingress Header Signature Verification
    const tenantHeader = message.headers.find(h => h.key === 'x-tenant-id')?.value;
    const tsHeader = message.headers.find(h => h.key === 'x-timestamp')?.value;
    const hashHeader = message.headers.find(h => h.key === 'x-payload-hash')?.value;
    const sigHeader = message.headers.find(h => h.key === 'x-ingress-signature')?.value;

    if (!tenantHeader || !tsHeader || !hashHeader || !sigHeader) {
      throw new Error('Kafka Zero-Trust Failure: Tampered or missing signed record headers');
    }

    const expectedHeaderPayload = `tenant=${tenantHeader}&ts=${tsHeader}&hash=${hashHeader}`;
    const expectedSig = crypto
      .createHmac('sha256', this.ingressSigningKey)
      .update(expectedHeaderPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(sigHeader, 'utf8');
    const expectedSigBuf = Buffer.from(expectedSig, 'utf8');

    if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
      throw new Error('Security Violation: Kafka record header signature verification failed (Tampering detected)');
    }

    // 2. Cryptographic Payload Binding Assertion (bind ciphertext to immutable signed header)
    const actualPayloadHash = crypto.createHash('sha256').update(message.encryptedPayload || '').digest('hex');
    if (actualPayloadHash !== hashHeader) {
      throw new Error('Security Violation: Kafka payload hash mismatch (Payload tampering detected)');
    }

    // 3. Strict Tenant Authorization Assertion
    if (consumerTenantContext !== tenantHeader || consumerTenantContext !== message.tenantId) {
      throw new Error(
        `Cross-Tenant Breach Blocked: Consumer tenant '${consumerTenantContext}' cannot decrypt payload for tenant '${message.tenantId}'. Payload remains raw ciphertext.`
      );
    }

    const kek = this.tenantKmsMasterKeys.get(consumerTenantContext);
    if (!kek) {
      throw new Error(`KMS Access Denied: No decryption key available for tenant '${consumerTenantContext}'`);
    }

    // 4. Unwrap DEK using Tenant KMS
    const dekParts = (message.encryptedDek || '').split(':');
    if (dekParts.length !== 3) {
      throw new Error('Kafka Zero-Trust Failure: Malformed wrapped DEK envelope structure');
    }
    const [dekIvB64, wrappedDekB64, dekTagB64] = dekParts;
    const dekIv = Buffer.from(dekIvB64, 'base64');
    const dekAuthTag = Buffer.from(dekTagB64, 'base64');

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', kek, dekIv);
    dekDecipher.setAuthTag(dekAuthTag);
    let rawDekB64 = dekDecipher.update(wrappedDekB64, 'base64', 'utf8');
    rawDekB64 += dekDecipher.final('utf8');

    const dek = Buffer.from(rawDekB64, 'base64');

    // 5. Decrypt Payload using DEK
    const iv = Buffer.from(message.iv, 'base64');
    const authTag = Buffer.from(message.authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);
    let plaintext = decipher.update(message.encryptedPayload, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}
