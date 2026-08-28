/**
 * Unit Tests: Media Download Detection & Streaming
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import { identifyMediaPlatform } from '../../server/mediaDownloadService';
import { getDownloadStreamUrl } from '../../src/services/api';

export async function runMediaDownloadTests(harness: TestHarness) {
  harness.describe('Media Download Detection & Stream Proxy Unit Tests', async () => {
    await harness.it('should accurately identify video platforms from URLs', () => {
      expect(identifyMediaPlatform('https://www.youtube.com/watch?v=123').platform).toBe('youtube');
      expect(identifyMediaPlatform('https://vt.tiktok.com/ZSVpx41DL/').platform).toBe('tiktok');
      expect(identifyMediaPlatform('https://www.instagram.com/reel/C123/').platform).toBe('instagram');
      expect(identifyMediaPlatform('https://www.facebook.com/watch?v=456').platform).toBe('facebook');
      expect(identifyMediaPlatform('https://x.com/user/status/789').platform).toBe('twitter');
      expect(identifyMediaPlatform('https://example.com/video.mp4').platform).toBe('generic');
    });

    await harness.it('should construct direct download stream proxy URLs with safe filenames', () => {
      const rawUrl = 'https://cdn.example.com/media/file.mp4?auth=token';
      const streamUrl = getDownloadStreamUrl(rawUrl, 'فيديو_تجريبي.mp4', 'video/mp4');
      expect(streamUrl).toContain('/api/download-stream?url=');
      expect(streamUrl).toContain('mime=video%2Fmp4');
      expect(streamUrl).toContain(encodeURIComponent(rawUrl));
    });
  });
}
