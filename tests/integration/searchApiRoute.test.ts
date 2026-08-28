/**
 * Integration Tests: /api/search API Route Handler
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import handler from '../../api/search';

export async function runSearchApiRouteIntegrationTests(harness: TestHarness) {
  await harness.describe('/api/search Route Edge Handler Integration Tests', async () => {
    await harness.it('should return 400 Bad Request when query parameter is missing or empty', async () => {
      const req = new Request('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '   ' })
      });

      const res = await handler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    await harness.it('should handle POST request with valid query and return ranked results', async () => {
      const req = new Request('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'سعر الذهب اليوم في مصر 2026',
          options: { maxResults: 5, hl: 'ar' }
        })
      });

      const res = await handler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query).toBe('سعر الذهب اليوم في مصر 2026');
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.intent).toBeDefined();
      expect(data.executionTimeMs).toBeDefined();
      expect(data.sourcesUsed).toBeDefined();
    });

    await harness.it('should handle GET request with URL query parameter', async () => {
      const req = new Request('http://localhost:3000/api/search?q=Nature%20quantum%20computing%202026&max=3', {
        method: 'GET'
      });

      const res = await handler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query).toBe('Nature quantum computing 2026');
      expect(data.results).toBeDefined();
    });
  });
}
