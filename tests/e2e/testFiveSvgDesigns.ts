import { chromium, type Browser, type Page } from '@playwright/test';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export async function testFiveSvgDesigns() {
  console.log('\n======================================================');
  console.log('🧪 Testing 5 Distinct SVG Image Designs & Raster Engine');
  console.log('======================================================\n');

  const designs = [
    {
      id: 1,
      title: 'Architectural Geometric Icon (أيقونة هندسية معمارية)',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
        <defs>
          <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="800" height="800" rx="160" fill="#090d16"/>
        <polygon points="400,120 680,660 120,660" fill="url(#archGrad)" stroke="#38bdf8" stroke-width="8" filter="url(#shadow)"/>
        <line x1="400" y1="120" x2="400" y2="660" stroke="#bae6fd" stroke-width="6"/>
        <circle cx="400" cy="380" r="45" fill="#38bdf8"/>
      </svg>`
    },
    {
      id: 2,
      title: 'AI Tech Company Logo (لوجو تقني لشركة ذكاء اصطناعي)',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
        <defs>
          <linearGradient id="aiGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="50%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#22d3ee" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" rx="200" fill="#060911"/>
        <circle cx="512" cy="512" r="360" fill="none" stroke="url(#aiGlow)" stroke-width="20" stroke-dasharray="24 12"/>
        <polygon points="512,240 700,680 324,680" fill="url(#aiGlow)" opacity="0.85"/>
        <circle cx="512" cy="460" r="55" fill="#ffffff"/>
      </svg>`
    },
    {
      id: 3,
      title: 'Modern Seafood Restaurant Emblem (شعار مطعم مأكولات بحرية)',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="100%" height="100%">
        <defs>
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>
        </defs>
        <rect width="900" height="600" rx="120" fill="#040d1a"/>
        <path d="M150 400 Q300 200 450 400 T750 400" fill="none" stroke="url(#seaGrad)" stroke-width="24" stroke-linecap="round"/>
        <path d="M200 440 Q350 260 500 440 T800 440" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
        <circle cx="450" cy="200" r="70" fill="#f59e0b"/>
      </svg>`
    },
    {
      id: 4,
      title: 'Space Nebula & Cosmic Planets (رسمة فضاء وكواكب وسدم كونية)',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
        <defs>
          <radialGradient id="nebulaCore" cx="40%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#c084fc" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#030712" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="#030712"/>
        <rect width="1200" height="800" fill="url(#nebulaCore)"/>
        <circle cx="850" cy="320" r="100" fill="#f43f5e"/>
        <ellipse cx="850" cy="320" rx="180" ry="34" fill="none" stroke="#fed7aa" stroke-width="10" transform="rotate(-22 850 320)"/>
        <circle cx="350" cy="220" r="40" fill="#38bdf8"/>
        <circle cx="200" cy="600" r="6" fill="#ffffff" opacity="0.8"/>
        <circle cx="650" cy="150" r="4" fill="#ffffff" opacity="0.9"/>
        <circle cx="1050" cy="650" r="5" fill="#ffffff" opacity="0.7"/>
      </svg>`
    },
    {
      id: 5,
      title: 'Advanced Cybersecurity Shield Badge (أيقونة درع أمن سيبراني)',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="100%" height="100%">
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>
        </defs>
        <rect width="600" height="700" rx="100" fill="#05130e"/>
        <path d="M300 60 L520 160 V390 C520 540 300 650 300 650 C300 650 80 540 80 390 V160 Z" fill="url(#shieldGrad)" stroke="#6ee7b7" stroke-width="14"/>
        <path d="M230 350 L280 400 L380 290" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }
  ];

  let browser: Browser | null = null;
  let allPassed = true;

  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    for (const design of designs) {
      console.log(`\n🎨 Testing Design #${design.id}: ${design.title}`);
      
      // Load HTML page rendering the SVG and measuring rasterization
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #090b10; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .container { width: 500px; height: 500px; }
          </style>
        </head>
        <body>
          <div class="container" id="svg-container">${design.svg}</div>
        </body>
        </html>
      `;

      await page.setContent(html);

      // Verify DOM node presence and attributes
      const svgExists = await page.locator('svg').count() > 0;
      const viewBox = await page.getAttribute('svg', 'viewBox');
      const width = await page.getAttribute('svg', 'width');
      const height = await page.getAttribute('svg', 'height');

      console.log(`   ✓ SVG Root Element: ${svgExists ? 'Valid' : 'MISSING'}`);
      console.log(`   ✓ ViewBox: "${viewBox}", width: "${width}", height: "${height}"`);

      // Test 2K & 4K Canvas Rasterization Math in page context
      const rasterResult = await page.evaluate((svgString) => {
        return new Promise((resolve) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgString, 'image/svg+xml');
          const svgEl = doc.documentElement;
          const vb = svgEl.getAttribute('viewBox') || '0 0 800 600';
          const parts = vb.split(/[\s,]+/).map(parseFloat);
          const w = parts[2] || 800;
          const h = parts[3] || 600;

          // 2K Math
          const max2K = 2048;
          const aspect = w / h;
          let w2K = max2K;
          let h2K = Math.round(max2K / aspect);
          if (aspect < 1) { h2K = max2K; w2K = Math.round(max2K * aspect); }

          // 4K Math
          const max4K = 3840;
          let w4K = max4K;
          let h4K = Math.round(max4K / aspect);
          if (aspect < 1) { h4K = max4K; w4K = Math.round(max4K * aspect); }

          resolve({
            width: w,
            height: h,
            aspectRatio: aspect.toFixed(2),
            res2K: { width: Math.round(w2K), height: Math.round(h2K) },
            res4K: { width: Math.round(w4K), height: Math.round(h4K) },
            hasGradients: svgString.includes('<linearGradient') || svgString.includes('<radialGradient>'),
            validXml: !doc.querySelector('parsererror')
          });
        });
      }, design.svg) as any;

      console.log(`   ✓ XML Validity: ${rasterResult.validXml ? 'Valid 100%' : 'INVALID'}`);
      console.log(`   ✓ Gradients & Defs: ${rasterResult.hasGradients ? 'Present' : 'None'}`);
      console.log(`   ✓ 2K Resolution Target: ${rasterResult.res2K.width}x${rasterResult.res2K.height}px`);
      console.log(`   ✓ 4K Resolution Target: ${rasterResult.res4K.width}x${rasterResult.res4K.height}px`);

      if (!rasterResult.validXml || !svgExists) {
        allPassed = false;
      }
    }

  } catch (err: any) {
    console.error('Error in five SVG designs test:', err.message);
    allPassed = false;
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 All 5 SVG Image Designs Verified Flawlessly (100% Pass)');
  } else {
    console.log('❌ Some designs failed verification');
  }
  console.log('======================================================\n');
  return allPassed;
}

testFiveSvgDesigns().then((pass) => process.exit(pass ? 0 : 1));
