import { scrapeDeepLink, resolveAndProfileUrl } from './server/linkResolver';

async function main() {
  console.log('================================================================');
  console.log('🧪 TESTING 4-TIER DEEP SCRAPER PIPELINE ACROSS PLATFORMS');
  console.log('================================================================\n');

  // 1. Twitter / X
  console.log('1️⃣ Testing X / Twitter Tweet (status: 20)...');
  const tw = await scrapeDeepLink('https://x.com/jack/status/20');
  console.log(tw.structuredContextBlock);
  console.log('----------------------------------------------------------------\n');

  // 2. Facebook Share Link
  console.log('2️⃣ Testing Facebook Share Link (https://www.facebook.com/share/p/19Dn6XiewB/)...');
  const fb = await scrapeDeepLink('https://www.facebook.com/share/p/19Dn6XiewB/');
  console.log(fb.structuredContextBlock);
  console.log('----------------------------------------------------------------\n');

  // 3. YouTube Link
  console.log('3️⃣ Testing YouTube Link (https://youtu.be/dQw4w9WgXcQ)...');
  const yt = await scrapeDeepLink('https://youtu.be/dQw4w9WgXcQ');
  console.log(yt.structuredContextBlock);
  console.log('----------------------------------------------------------------\n');

  // 4. Web Article Link
  console.log('4️⃣ Testing Generic Web Link (https://example.com)...');
  const web = await scrapeDeepLink('https://example.com');
  console.log(web.structuredContextBlock);
  console.log('================================================================');
}

main().catch(err => console.error('Error:', err));

