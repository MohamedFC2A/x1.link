export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';

export default async function handler(req: Request) {
  const requestId = req.headers.get('x-request-id') || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now());
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.6.0',
      requestId,
      services: {
        edge: 'online',
        inference: 'online'
      }
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': requestId,
        'cache-control': 'no-cache, no-store'
      }
    }
  );
}
