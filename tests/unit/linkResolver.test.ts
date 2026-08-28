/**
 * Unit Tests: Link Resolver & URL Extraction
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { extractAllCleanUrls, extractYouTubeVideoId, detectAndExtractUrl } from '../../src/lib/utils';
import { isTikTokUrl, extractTikTokUrlFromText } from '../../server/tiktokService';

export async function runLinkResolverTests(harness: TestHarness) {
  await harness.describe('Link Resolver & Multi-Platform URL Extraction Unit Tests', async () => {
    await harness.it('should extract clean URLs from Arabic text with surrounding punctuation', () => {
      const text = 'شاهد هذا الرابط https://vt.tiktok.com/ZSVpx41DL/ وتأكد منه يا صديقي';
      const extraction = extractAllCleanUrls(text);
      expect(extraction.urls).toHaveLength(1);
      expect(extraction.urls[0]).toBe('https://vt.tiktok.com/ZSVpx41DL/');
      expect(extraction.remainingText).toBe('شاهد هذا الرابط وتأكد منه يا صديقي');
    });

    await harness.it('should extract multiple URLs without duplicates', () => {
      const text = 'رابط أول https://youtu.be/dQw4w9WgXcQ ورابط مكرر https://youtu.be/dQw4w9WgXcQ ورابط آخر https://google.com/';
      const extraction = extractAllCleanUrls(text);
      expect(extraction.urls).toHaveLength(2);
      expect(extraction.urls).toContain('https://youtu.be/dQw4w9WgXcQ');
      expect(extraction.urls).toContain('https://google.com/');
    });

    await harness.it('should extract YouTube video IDs from various formats', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    await harness.it('should detect TikTok short and standard URLs', () => {
      expect(isTikTokUrl('https://vt.tiktok.com/ZSVpx41DL/')).toBe(true);
      expect(isTikTokUrl('https://www.tiktok.com/@username/video/1234567890')).toBe(true);
      expect(isTikTokUrl('https://youtube.com')).toBe(false);
    });
  });
}
