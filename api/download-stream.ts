export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const mediaUrl = req.query?.url;
    const filename = (req.query?.filename as string) || 'download_detect_media.mp4';
    const mimeType = (req.query?.mime as string) || 'video/mp4';

    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }

    const cleanFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    const safeEncodedFilename = encodeURIComponent(cleanFilename);

    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"; filename*=UTF-8''${safeEncodedFilename}`);
    res.setHeader('Content-Type', mimeType);

    const upstreamRes = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        ...(mediaUrl.startsWith('http') ? { 'Referer': new URL(mediaUrl).origin } : {}),
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return res.redirect(mediaUrl);
    }

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const reader = upstreamRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(value);
    }
  } catch (err: any) {
    console.error('[Vercel API /api/download-stream Error]:', err);
    return res.status(500).json({ error: err?.message || 'Failed to stream media' });
  }
}
