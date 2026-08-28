import { scrapeDeepLink, resolveAndProfileUrl } from './server/linkResolver';
import { fetchTikTokData } from './server/tiktokService';
import { extractTikTokKeyframes, performVideoVisionPerception } from './server/videoVisionService';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('================================================================');
  console.log('🧪 TESTING 4-TIER DEEP SCRAPER & TIKTOK MULTIMODAL VISION');
  console.log('================================================================\n');

  // 1. TikTok Video & Multimodal Keyframe Vision Perception
  console.log('1️⃣ Testing TikTok Video (https://vt.tiktok.com/ZSVpx41DL/)...');
  const ttData: any = await fetchTikTokData('https://vt.tiktok.com/ZSVpx41DL/');
  console.log('Title:', ttData.title);
  console.log('Author:', ttData.author?.username);
  console.log('Duration:', ttData.durationSeconds, 'seconds');
  console.log('Play URL:', ttData.playUrl ? '✓ Available' : '✗ Missing');

  const keyframes = await extractTikTokKeyframes(ttData.thumbnailUrl, ttData.extraFrames, ttData.durationSeconds);
  console.log(`Extracted (${keyframes.length}) timeline keyframes with ffmpeg.`);

  const vision = await performVideoVisionPerception(
    ttData.videoId,
    'tiktok',
    keyframes,
    {
      title: ttData.description || ttData.title,
      creator: `@${ttData.author.username}`,
      userPrompt: 'هل ظهر ميكروفون في الفديو ؟',
    }
  );
  console.log('✓ Vision Perception Result Summary:', vision?.visualAnalysisAr ? `${vision.visualAnalysisAr.slice(0, 120)}...` : 'Failed');
  console.log('----------------------------------------------------------------\n');

  // 2. Twitter / X
  console.log('2️⃣ Testing X / Twitter Tweet (status: 20)...');
  const tw = await scrapeDeepLink('https://x.com/jack/status/20');
  console.log(tw.structuredContextBlock?.slice(0, 150));
  console.log('----------------------------------------------------------------\n');

  // 3. YouTube Link
  console.log('3️⃣ Testing YouTube Link (https://youtu.be/dQw4w9WgXcQ)...');
  const yt = await scrapeDeepLink('https://youtu.be/dQw4w9WgXcQ');
  console.log(yt.structuredContextBlock?.slice(0, 150));
  console.log('================================================================');
}

main().catch(err => console.error('Error:', err));



