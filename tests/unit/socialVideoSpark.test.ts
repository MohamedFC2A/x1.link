/**
 * Unit Tests: Social Video & Fathom Spark Intelligence
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { getActiveDetectedFeatures } from '../../src/lib/featuresRegistry';
import { containsYouTubeUrl } from '../../server/youtubeTranscript';
import { isTikTokUrl } from '../../server/tiktokService';
import { detectSocialPlatform, extractSocialUrlFromText } from '../../server/socialVideoService';

export async function runSocialVideoSparkTests(harness: TestHarness) {
  await harness.describe('Social Video Intelligence & Fathom Spark Detection', async () => {
    
    await harness.it('should detect YouTube video URLs across standard, short, and shorts formats', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
      ];
      urls.forEach(u => {
        expect(containsYouTubeUrl(u)).toBe(true);
      });
      expect(containsYouTubeUrl('https://example.com/not-a-video')).toBe(false);
    });

    await harness.it('should detect TikTok URLs across standard, vt, and vm domains', () => {
      const urls = [
        'https://www.tiktok.com/@user/video/7123456789012345678',
        'https://vt.tiktok.com/ZSN123456/',
        'https://vm.tiktok.com/ZSN654321/'
      ];
      urls.forEach(u => {
        expect(isTikTokUrl(u)).toBe(true);
      });
      expect(isTikTokUrl('https://instagram.com/p/abc')).toBe(false);
    });

    await harness.it('should detect Instagram Reels and video posts', () => {
      const reelUrl = 'https://www.instagram.com/reel/C3abc123xyz/';
      const postUrl = 'https://instagram.com/p/C3abc123xyz/';
      expect(detectSocialPlatform(reelUrl)).toBe('instagram');
      expect(detectSocialPlatform(postUrl)).toBe('instagram');
      const extracted = extractSocialUrlFromText(`شوف ده ${reelUrl} واحكم`);
      expect(Boolean(extracted)).toBe(true);
      expect(extracted?.platform).toBe('instagram');
    });

    await harness.it('should detect Facebook Video and Watch links', () => {
      const watchUrl = 'https://fb.watch/abcd1234ef/';
      const videoUrl = 'https://www.facebook.com/user/videos/1234567890/';
      expect(detectSocialPlatform(watchUrl)).toBe('facebook');
      expect(detectSocialPlatform(videoUrl)).toBe('facebook');
      const extracted = extractSocialUrlFromText(`مقطع مهم ${watchUrl}`);
      expect(Boolean(extracted)).toBe(true);
      expect(extracted?.platform).toBe('facebook');
    });

    await harness.it('should detect X/Twitter video status URLs', () => {
      const xUrl = 'https://x.com/username/status/1234567890123456789';
      const twitterUrl = 'https://twitter.com/username/status/1234567890123456789';
      expect(detectSocialPlatform(xUrl)).toBe('twitter');
      expect(detectSocialPlatform(twitterUrl)).toBe('twitter');
      const extracted = extractSocialUrlFromText(`تغريدة جديدة ${xUrl}`);
      expect(Boolean(extracted)).toBe(true);
      expect(extracted?.platform).toBe('twitter');
    });

    await harness.it('should route video URLs to fathom_spark in featuresRegistry with confidence 1.0', () => {
      const testCases = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://vt.tiktok.com/ZSN123456/',
        'https://www.instagram.com/reel/C3abc123xyz/',
        'https://fb.watch/abcd1234ef/',
        'https://x.com/user/status/123456'
      ];

      testCases.forEach(testUrl => {
        const features = getActiveDetectedFeatures(
          `حلل هذا المقطع ${testUrl}`,
          '',
          '',
          { hasVideo: true, hasSpark: true }
        );

        const sparkFeature = features.find(f => f.id === 'fathom_spark');
        expect(sparkFeature).toBeDefined();
        expect(sparkFeature?.confidence).toBe(1.0);
        expect(sparkFeature?.shouldRenderWidget).toBe(true);
      });
    });

    await harness.it('should verify thinking-loop suppression regex detects video links', () => {
      const videoCheckRegex = /(?:youtube\.com|youtu\.be|yt\.be|tiktok\.com|douyin\.com|instagram\.com\/(?:reel|p|tv)|instagr\.am|fb\.watch|facebook\.com\/(?:watch|reel|.*\/videos)|twitter\.com\/.*\/status|x\.com\/.*\/status|\.mp4|\.webm|\.m4a|\.mp3|\.wav)/i;
      
      expect(videoCheckRegex.test('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(videoCheckRegex.test('https://vt.tiktok.com/ZSN123456/')).toBe(true);
      expect(videoCheckRegex.test('https://instagram.com/reel/C3abc123xyz/')).toBe(true);
      expect(videoCheckRegex.test('https://fb.watch/abcd1234ef/')).toBe(true);
      expect(videoCheckRegex.test('https://x.com/user/status/123456')).toBe(true);
      expect(videoCheckRegex.test('ما رأيك في فلسفة كانط؟')).toBe(false);
    });

  });
}
