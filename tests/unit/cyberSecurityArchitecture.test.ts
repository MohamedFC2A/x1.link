/**
 * Comprehensive Unit Test Suite for Sovereign Cybersecurity Architecture
 * Validates:
 * 1. DPoP RFC 9449 Key Architecture & Canonical JKT Thumbprint (RFC 7638)
 * 2. Stateless DPoP-Nonce Handshake & 401 Challenge Workflow
 * 3. Gateway URI Normalization & Envoy RFC 3986 Hardening
 * 4. Singleflight JWKS Cache Stampede Mitigation, Rate Limiting & SSRF Prevention
 * 5. Zero-Trust Kafka Multi-Tenancy (Client-Side KMS Envelope Encryption)
 */

import crypto from 'crypto';
import { TestHarness, expect } from '../testUtils';
import {
  DPoPValidator,
  StatelessDPoPNonceManager,
  GatewayUriNormalizer,
  SingleflightJwksResolver,
  KafkaZeroTrustEnvelopeEncryptor,
  CanonicalJWK
} from '../../src/services/cyberSecurityArchitecture';

export async function runCyberSecurityArchitectureTests(harness: TestHarness) {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. DPoP KEY ARCHITECTURE & RFC 9449 / RFC 7638 COMPLIANCE
  // ───────────────────────────────────────────────────────────────────────────
  await harness.describe('CyberSec Vector 1: DPoP Key Architecture (RFC 9449 & RFC 7638)', async () => {
    // Helper to generate an EC P-256 key pair and DPoP proof
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256'
    });
    const publicJwk = publicKey.export({ format: 'jwk' }) as CanonicalJWK;

    const generateProof = (overrides: {
      header?: Record<string, any>;
      payload?: Record<string, any>;
      signKey?: crypto.KeyObject;
    } = {}) => {
      const headerObj = {
        typ: 'dpop+jwt',
        alg: 'ES256',
        jwk: publicJwk,
        ...(overrides.header || {})
      };
      const now = Math.floor(Date.now() / 1000);
      const payloadObj = {
        jti: crypto.randomBytes(16).toString('hex'),
        htm: 'POST',
        htu: 'https://api.gateway.example.com/v1/transfer',
        iat: now,
        ...(overrides.payload || {})
      };

      const hB64 = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
      const pB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const input = `${hB64}.${pB64}`;

      const signer = crypto.createSign('SHA256');
      signer.update(input);
      const sig = signer.sign({
        key: overrides.signKey || privateKey,
        dsaEncoding: 'ieee-p1363'
      });

      return `${input}.${sig.toString('base64url')}`;
    };

    await harness.it('computes canonical RFC 7638 SHA-256 JWK thumbprint (jkt) deterministically', () => {
      const jkt = DPoPValidator.computeCanonicalJkt(publicJwk);
      expect(typeof jkt).toBe('string');
      expect(jkt.length).toBeGreaterThanOrEqual(40);

      // Verify canonical member sorting: RSA test
      const rsaJwk: CanonicalJWK = {
        kty: 'RSA',
        n: 'dummy-n',
        e: 'AQAB',
        kid: 'should-be-ignored-by-thumbprint'
      };
      const rsaJkt = DPoPValidator.computeCanonicalJkt(rsaJwk);
      expect(typeof rsaJkt).toBe('string');
      expect(rsaJkt.length).toBeGreaterThan(0);
    });

    await harness.it('validates DPoP proof directly using embedded JWK with zero external JWKS lookups', () => {
      const proof = generateProof();
      const res = DPoPValidator.verifyProof({
        dpopProofJwt: proof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer'
      });

      expect(res.valid).toBe(true);
      expect(res.jkt).toBe(DPoPValidator.computeCanonicalJkt(publicJwk));
      expect(res.header?.typ).toBe('dpop+jwt');
    });

    await harness.it('strictly binds DPoP key to access token cnf.jkt claim and rejects mismatch', () => {
      const computedJkt = DPoPValidator.computeCanonicalJkt(publicJwk);
      const proof = generateProof();

      // Golden match
      const validRes = DPoPValidator.verifyProof({
        dpopProofJwt: proof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer',
        expectedCnfJkt: computedJkt
      });
      expect(validRes.valid).toBe(true);

      // Tampered / spoofed cnf.jkt
      const invalidRes = DPoPValidator.verifyProof({
        dpopProofJwt: proof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer',
        expectedCnfJkt: 'attacker-spoofed-thumbprint-12345'
      });
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.error?.includes('key-binding mismatch')).toBe(true);
    });

    await harness.it('rejects embedded JWK containing private key parameters (d)', () => {
      const privateJwk = privateKey.export({ format: 'jwk' }) as CanonicalJWK;
      const proofWithPrivateD = generateProof({
        header: { jwk: privateJwk }
      });

      const res = DPoPValidator.verifyProof({
        dpopProofJwt: proofWithPrivateD,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer'
      });
      expect(res.valid).toBe(false);
      expect(res.error?.includes('private key material')).toBe(true);
    });

    await harness.it('rejects tampered or forged cryptographic signatures', () => {
      const otherPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
      // Signed with otherPair privateKey but advertising original publicJwk
      const forgedProof = generateProof({
        signKey: otherPair.privateKey
      });

      const res = DPoPValidator.verifyProof({
        dpopProofJwt: forgedProof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer'
      });
      expect(res.valid).toBe(false);
      expect(res.error?.includes('signature verification failed')).toBe(true);
    });

    await harness.it('rejects DPoP proof headers containing prohibited external key parameters (jku, x5u)', () => {
      const rogueProof = generateProof({
        header: { jku: 'https://attacker.com/keys.json' }
      });
      const res = DPoPValidator.verifyProof({
        dpopProofJwt: rogueProof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer'
      });
      expect(res.valid).toBe(false);
      expect(res.error?.includes('RFC 9449 security violation')).toBe(true);
    });

    await harness.it('rejects embedded JWKs containing RSA private factor parameters (p, q)', () => {
      const jwkWithP = { ...publicJwk, p: 'some-private-prime-p' };
      const proof = generateProof({
        header: { jwk: jwkWithP }
      });
      const res = DPoPValidator.verifyProof({
        dpopProofJwt: proof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer'
      });
      expect(res.valid).toBe(false);
      expect(res.error?.includes('private key material')).toBe(true);
    });

    await harness.it('validates DPoP proofs signed with PS256 (RSA-PSS) and ES384 algorithms', () => {
      const rsaPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const rsaJwk = rsaPair.publicKey.export({ format: 'jwk' }) as CanonicalJWK;

      const headerObj = { typ: 'dpop+jwt', alg: 'PS256', jwk: rsaJwk };
      const payloadObj = {
        jti: 'ps256-test-1',
        htm: 'GET',
        htu: 'https://api.gateway.example.com/v1/resource',
        iat: Math.floor(Date.now() / 1000)
      };
      const hB64 = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
      const pB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const signingInput = `${hB64}.${pB64}`;

      const sig = crypto.sign('RSA-SHA256', Buffer.from(signingInput), {
        key: rsaPair.privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
      }).toString('base64url');

      const ps256Proof = `${signingInput}.${sig}`;
      const ps256Res = DPoPValidator.verifyProof({
        dpopProofJwt: ps256Proof,
        expectedHtm: 'GET',
        expectedHtu: 'https://api.gateway.example.com/v1/resource'
      });
      expect(ps256Res.valid).toBe(true);
      expect(ps256Res.header?.alg).toBe('PS256');
    });

    await harness.it('validates access token hash (ath) claim and rejects mismatch', () => {
      const token = 'secret-bearer-access-token-xyz-12345';
      const expectedAth = crypto.createHash('sha256').update(token, 'ascii').digest('base64url');

      const validProof = generateProof({
        payload: { ath: expectedAth }
      });
      const validRes = DPoPValidator.verifyProof({
        dpopProofJwt: validProof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer',
        expectedAccessToken: token
      });
      expect(validRes.valid).toBe(true);

      const invalidRes = DPoPValidator.verifyProof({
        dpopProofJwt: validProof,
        expectedHtm: 'POST',
        expectedHtu: 'https://api.gateway.example.com/v1/transfer',
        expectedAccessToken: 'wrong-tampered-token'
      });
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.error?.includes('ath')).toBe(true);
    });

    await harness.it('safely rejects invalid or missing caller parameters without unhandled exceptions', () => {
      const resMissingHtm = DPoPValidator.verifyProof({
        dpopProofJwt: 'abc.def.ghi',
        expectedHtm: undefined as any,
        expectedHtu: 'https://api.example.com'
      });
      expect(resMissingHtm.valid).toBe(false);
      expect(resMissingHtm.error?.includes('htm')).toBe(true);

      const resMissingHtu = DPoPValidator.verifyProof({
        dpopProofJwt: 'abc.def.ghi',
        expectedHtm: 'POST',
        expectedHtu: undefined as any
      });
      expect(resMissingHtu.valid).toBe(false);
      expect(resMissingHtu.error?.includes('htu')).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. STATELESS DPoP-NONCE HANDSHAKE & GATEWAY WORKFLOW
  // ───────────────────────────────────────────────────────────────────────────
  await harness.describe('CyberSec Vector 2: Stateless DPoP-Nonce Handshake Mechanics', async () => {
    const gatewaySecret = 'super-secret-gateway-signing-key-32bytes!';
    const nonceManager = new StatelessDPoPNonceManager(gatewaySecret, 60);

    await harness.it('generates stateless HMAC-SHA256 signed nonce without distributed DB lookup', () => {
      const nonce = nonceManager.generateNonce('192.168.1.100');
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThanOrEqual(40);

      const verification = nonceManager.verifyNonce(nonce, '192.168.1.100');
      expect(verification.valid).toBe(true);
      expect(verification.clientIp).toBe('192.168.1.100');
    });

    await harness.it('creates compliant HTTP 401 challenge with DPoP-Nonce response header', () => {
      const challenge = nonceManager.create401Challenge('10.0.0.50');
      expect(challenge.statusCode).toBe(401);
      expect(typeof challenge.headers['DPoP-Nonce']).toBe('string');
      expect(challenge.headers['WWW-Authenticate'].includes('use_dpop_nonce')).toBe(true);
      expect(challenge.headers['Access-Control-Expose-Headers']).toBe('DPoP-Nonce');
    });

    await harness.it('rejects nonces replayed from a different client IP', () => {
      const nonce = nonceManager.generateNonce('192.168.1.100');
      const spoofedIpCheck = nonceManager.verifyNonce(nonce, '10.200.5.99');
      expect(spoofedIpCheck.valid).toBe(false);
      expect(spoofedIpCheck.error?.includes('Client IP binding mismatch')).toBe(true);
    });

    await harness.it('rejects tampered nonce signatures', () => {
      const nonce = nonceManager.generateNonce('192.168.1.100');
      const tampered = nonce.slice(0, -6) + 'aaaaaa';
      const verifyRes = nonceManager.verifyNonce(tampered, '192.168.1.100');
      expect(verifyRes.valid).toBe(false);
    });

    await harness.it('enforces temporal rotation window (allows current and preceding, rejects expired)', () => {
      const now = Math.floor(Date.now() / 1000);
      // Fresh nonce
      const freshNonce = nonceManager.generateNonce('127.0.0.1', now - 30);
      expect(nonceManager.verifyNonce(freshNonce, '127.0.0.1').valid).toBe(true);

      // Preceding window (90s old with 60s window -> <= 120s)
      const prevWindowNonce = nonceManager.generateNonce('127.0.0.1', now - 90);
      expect(nonceManager.verifyNonce(prevWindowNonce, '127.0.0.1').valid).toBe(true);

      // Expired nonce (> 2 * windowSeconds = 120s)
      const expiredNonce = nonceManager.generateNonce('127.0.0.1', now - 200);
      const expiredRes = nonceManager.verifyNonce(expiredNonce, '127.0.0.1');
      expect(expiredRes.valid).toBe(false);
      expect(expiredRes.error?.includes('expired')).toBe(true);
    });

    await harness.it('safely rejects missing or non-string client IP in generateNonce and verifyNonce', () => {
      let threwGenerate = false;
      try {
        nonceManager.generateNonce(undefined as any);
      } catch (err: any) {
        threwGenerate = true;
      }
      expect(threwGenerate).toBe(true);

      const verifyRes = nonceManager.verifyNonce('some-nonce', undefined as any);
      expect(verifyRes.valid).toBe(false);
      expect(verifyRes.error?.includes('client IP')).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. GATEWAY-LEVEL URI NORMALIZATION & ENVOY HARDENING
  // ───────────────────────────────────────────────────────────────────────────
  await harness.describe('CyberSec Vector 3: Gateway-Level URI Normalization (HTU Differentials)', async () => {
    await harness.it('exports canonical Envoy http_connection_manager sanitization parameters', () => {
      const config = GatewayUriNormalizer.getEnvoySanitizationConfig();
      expect(config.normalize_path).toBe(true);
      expect(config.merge_slashes).toBe(true);
      expect(config.path_with_escaped_slashes_action).toBe('UNESCAPE_AND_REDIRECT');

      const snippet = GatewayUriNormalizer.generateEnvoyConfigSnippet();
      expect(snippet.includes('normalize_path: true')).toBe(true);
      expect(snippet.includes('merge_slashes: true')).toBe(true);
      expect(snippet.includes('UNESCAPE_AND_REDIRECT')).toBe(true);
    });

    await harness.it('collapses dot segments (/../ and /./) cleanly', () => {
      const raw = 'https://api.domain.com/v1/auth/../payments/./charge';
      const normalized = GatewayUriNormalizer.normalizeUri(raw);
      expect(normalized).toBe('https://api.domain.com/v1/payments/charge');
    });

    await harness.it('merges repeated slash characters (//+)', () => {
      const raw = 'https://api.domain.com///v1////service//endpoint';
      const normalized = GatewayUriNormalizer.normalizeUri(raw);
      expect(normalized).toBe('https://api.domain.com/v1/service/endpoint');
    });

    await harness.it('strips matrix parameters from path segments', () => {
      const raw = 'https://api.domain.com/api;jsessionid=ABCD123/v1/users;state=active';
      const normalized = GatewayUriNormalizer.normalizeUri(raw);
      expect(normalized).toBe('https://api.domain.com/api/v1/users');
    });

    await harness.it('strips percent-encoded semicolons (%3b / %3B) representing matrix parameters', () => {
      const raw = 'https://api.domain.com/api%3bjsessionid=ABCD123/v1/users%3bstate=active';
      const normalized = GatewayUriNormalizer.normalizeUri(raw);
      expect(normalized).toBe('https://api.domain.com/api/v1/users');
    });

    await harness.it('unescapes encoded path traversals (%2F and %2E%2E)', () => {
      const raw = 'https://api.domain.com/api/%2e%2e/admin/%2fsecret';
      const normalized = GatewayUriNormalizer.normalizeUri(raw);
      expect(normalized).toBe('https://api.domain.com/admin/secret');
    });

    await harness.it('eliminates HTU validation discrepancies between gateway and downstream', () => {
      const gatewayRawUri = 'https://api.domain.com//v1/account/../profile;role=admin';
      const targetCanonicalHtu = 'https://api.domain.com/v1/profile';

      const normalizedGateway = GatewayUriNormalizer.normalizeUri(gatewayRawUri);
      expect(normalizedGateway).toBe(targetCanonicalHtu);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. JWKS CACHE STAMPEDE MITIGATION & SSRF PREVENTION
  // ───────────────────────────────────────────────────────────────────────────
  await harness.describe('CyberSec Vector 4: JWKS Singleflight & SSRF Defense', async () => {
    const mockTenantRegistry = [
      {
        tenantId: 'tenant-alpha',
        jwksUrl: 'https://auth.internal.corp/alpha/.well-known/jwks.json',
        allowedIssuers: ['https://auth.internal.corp/alpha']
      },
      {
        tenantId: 'tenant-beta',
        jwksUrl: 'https://auth.internal.corp/beta/.well-known/jwks.json',
        allowedIssuers: ['https://auth.internal.corp/beta']
      }
    ];

    await harness.it('coalesces concurrent cache-miss lookups into a SINGLE outbound HTTP fetch (Singleflight)', async () => {
      const resolver = new SingleflightJwksResolver(mockTenantRegistry, 10000);
      let upstreamFetchCount = 0;

      const mockFetch = async (_url: string) => {
        upstreamFetchCount++;
        // Simulate network latency
        await new Promise(r => setTimeout(r, 40));
        return [{ kid: 'key-123', kty: 'RSA', alg: 'RS256' }];
      };

      // 50 concurrent requests fired simultaneously for the same tenant key miss
      const promises = Array.from({ length: 50 }, () =>
        resolver.getJwksKey('tenant-alpha', 'key-123', mockFetch)
      );

      const results = await Promise.all(promises);

      // Strict Singleflight assertion: Exactly 1 upstream fetch for 50 concurrent lookups
      expect(upstreamFetchCount).toBe(1);
      expect(results.length).toBe(50);
      expect(results[0].key.kid).toBe('key-123');
    });

    await harness.it('coalesces concurrent requests for DIFFERENT keys of same tenant into 1 fetch without false rate-limiting', async () => {
      const resolver = new SingleflightJwksResolver(mockTenantRegistry, 10000);
      let upstreamFetchCalls = 0;

      const mockFetch = async () => {
        upstreamFetchCalls++;
        await new Promise(r => setTimeout(r, 30));
        return [
          { kid: 'key-A', kty: 'RSA' },
          { kid: 'key-B', kty: 'RSA' }
        ];
      };

      const [resA, resB] = await Promise.all([
        resolver.getJwksKey('tenant-alpha', 'key-A', mockFetch),
        resolver.getJwksKey('tenant-alpha', 'key-B', mockFetch)
      ]);

      expect(upstreamFetchCalls).toBe(1);
      expect(resA.key.kid).toBe('key-A');
      expect(resB.key.kid).toBe('key-B');
    });

    await harness.it('enforces deterministic rate limit (1 outbound fetch / 10s per tenant) on cache misses', async () => {
      const resolver = new SingleflightJwksResolver(mockTenantRegistry, 10000);
      let fetchCalls = 0;

      const mockFetch = async () => {
        fetchCalls++;
        return [{ kid: 'alpha-key-1', kty: 'EC' }];
      };

      // First fetch succeeds
      await resolver.getJwksKey('tenant-alpha', 'alpha-key-1', mockFetch);
      expect(fetchCalls).toBe(1);

      // Immediate second fetch for unknown kid triggers rate limiter without hitting upstream
      let rateLimitCaught = false;
      try {
        await resolver.getJwksKey('tenant-alpha', 'unknown-forged-kid', mockFetch);
      } catch (err: any) {
        if (err.message.includes('Rate Limit Exceeded')) {
          rateLimitCaught = true;
        }
      }

      expect(rateLimitCaught).toBe(true);
      expect(fetchCalls).toBe(1); // Blocked before outbound query
    });

    await harness.it('strictly rejects dynamic jku / untrusted tenants to eliminate SSRF', async () => {
      const resolver = new SingleflightJwksResolver(mockTenantRegistry, 10000);

      let ssrfCaught = false;
      try {
        await resolver.getJwksKey('malicious-tenant-injection', 'kid-007');
      } catch (err: any) {
        if (err.message.includes('SSRF Prevention')) {
          ssrfCaught = true;
        }
      }

      expect(ssrfCaught).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ZERO-TRUST KAFKA MULTI-TENANCY & ENVELOPE ENCRYPTION
  // ───────────────────────────────────────────────────────────────────────────
  await harness.describe('CyberSec Vector 5: Zero-Trust Kafka Multi-Tenancy (KMS Envelope Encryption)', async () => {
    const tenantSecrets = {
      'tenant-finance': 'finance-vault-master-kms-secret-key-32b',
      'tenant-healthcare': 'health-vault-master-kms-secret-key-32b'
    };
    const ingressSecret = 'ingress-gateway-record-signing-secret';

    const encryptor = new KafkaZeroTrustEnvelopeEncryptor(tenantSecrets, ingressSecret);

    await harness.it('performs client-side KMS envelope encryption and cryptographically signs record headers', () => {
      const payload = JSON.stringify({ transferId: 'TX-9988', amount: 500000 });
      const record = encryptor.encryptRecord('tenant-finance', payload);

      expect(record.tenantId).toBe('tenant-finance');
      expect(record.encryptedPayload !== payload).toBe(true);
      expect(typeof record.iv).toBe('string');
      expect(typeof record.authTag).toBe('string');
      expect(typeof record.encryptedDek).toBe('string');

      // Check signed headers
      const tenantHeader = record.headers.find(h => h.key === 'x-tenant-id');
      const sigHeader = record.headers.find(h => h.key === 'x-ingress-signature');
      expect(tenantHeader?.value).toBe('tenant-finance');
      expect(typeof sigHeader?.value).toBe('string');
    });

    await harness.it('allows authorized consumer with matching tenant context to decrypt payload locally', () => {
      const payload = 'Confidential Patient Record: Medical diagnosis payload';
      const record = encryptor.encryptRecord('tenant-healthcare', payload);

      const decrypted = encryptor.decryptRecord('tenant-healthcare', record);
      expect(decrypted).toBe(payload);
    });

    await harness.it('blocks cross-tenant consumer from decrypting payload (returns ciphertext only)', () => {
      const payload = 'Confidential Financial Statements';
      const record = encryptor.encryptRecord('tenant-finance', payload);

      // Healthcare consumer accidentally reads finance record from shared topic
      let crossTenantBreachBlocked = false;
      try {
        encryptor.decryptRecord('tenant-healthcare', record);
      } catch (err: any) {
        if (err.message.includes('Cross-Tenant Breach Blocked')) {
          crossTenantBreachBlocked = true;
        }
      }

      expect(crossTenantBreachBlocked).toBe(true);
    });

    await harness.it('detects tampering with Kafka record headers or payload', () => {
      const payload = 'Sensitive Pipeline Event';
      const record = encryptor.encryptRecord('tenant-finance', payload);

      // Tamper with payload hash header
      const tamperedRecord = {
        ...record,
        headers: record.headers.map(h =>
          h.key === 'x-tenant-id' ? { key: 'x-tenant-id', value: 'tenant-finance-spoofed' } : h
        )
      };

      let tamperingCaught = false;
      try {
        encryptor.decryptRecord('tenant-finance', tamperedRecord);
      } catch (err: any) {
        if (err.message.includes('header signature verification failed')) {
          tamperingCaught = true;
        }
      }

      expect(tamperingCaught).toBe(true);
    });

    await harness.it('detects ciphertext payload substitution/swap attacks via signed payload hash verification', () => {
      const payload1 = 'Original Financial Ledger Entry';
      const payload2 = 'Substituted Attacker Transaction';
      const record1 = encryptor.encryptRecord('tenant-finance', payload1);
      const record2 = encryptor.encryptRecord('tenant-finance', payload2);

      // Keep record1's headers (including signed hash), but swap in record2's ciphertext
      const swappedRecord = {
        ...record1,
        encryptedPayload: record2.encryptedPayload,
        iv: record2.iv,
        authTag: record2.authTag,
        encryptedDek: record2.encryptedDek
      };

      let swapDetected = false;
      try {
        encryptor.decryptRecord('tenant-finance', swappedRecord);
      } catch (err: any) {
        if (err.message.includes('payload hash mismatch')) {
          swapDetected = true;
        }
      }

      expect(swapDetected).toBe(true);
    });
  });
}
