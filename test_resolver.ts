import { resolveAndProfileUrl } from './server/linkResolver';

async function main() {
  const urls = [
    'https://share.google/8vmn8EuLXAcCEUjmZ',
    'https://share.google/s4u3fllweQE4l4sER',
  ];
  for (const u of urls) {
    console.log(`\n================== RESOLVING ${u} ==================`);
    const result = await resolveAndProfileUrl(u);
    console.log('Original URL:', result.originalUrl);
    console.log('Domain:', result.domain);
    console.log('Favicon:', result.brandAssets.favicon);
    console.log('Best Logo:', result.brandAssets.bestLogoUrl);
    console.log('Frameworks:', result.frameworks);
    console.log('Summary:\n', result.rawAnalysisSummaryAr);
  }
}

main().catch(err => console.error('Error:', err));
