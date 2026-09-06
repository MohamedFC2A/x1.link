// Edge Serverless Endpoint: /api/early-access-action
// Handles 1-Tap Action from CEO & Founder Mohamed Matany via Telegram

export const config = {
  runtime: 'edge',
};

export const runtime = 'edge';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505397370:AAHaWajm8k0TFBafpkiHPsQQ4dSk4KITt7U';
const PRIMARY_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8495121463';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action'); // 'approve' | 'reject'
  const requestId = url.searchParams.get('id');
  const secret = url.searchParams.get('secret');

  if (!action || !requestId || !secret) {
    return new Response('بيانات الطلب غير صالحة أو ناقصة.', { status: 400 });
  }

  try {
    // 1. Verify Secret and Request in Supabase
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(requestId)}&approval_secret=eq.${encodeURIComponent(secret)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!checkRes.ok) {
      return new Response('خطأ في الاتصال بقاعدة البيانات.', { status: 500 });
    }

    const requests = await checkRes.json();
    if (!Array.isArray(requests) || requests.length === 0) {
      return new Response('طلب غير موجود أو رمز الحماية غير متطابق.', { status: 403 });
    }

    const requestData = requests[0];
    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'approved' : 'rejected';

    // 2. Update Supabase Request Status
    await fetch(`${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: 'CEO Mohamed Matany',
        updated_at: new Date().toISOString(),
      }),
    });

    // 3. Dispatch Confirmation to Telegram
    const actionNotice = isApproved
      ? `🎉 <b>[تم تفعيل واعتماد الوصول الفوري بنجاح!]</b>
━━━━━━━━━━━━━━━━━━━━━
قام <b>الرئيس التنفيذي محمد مطعني</b> بالموافقة الرسمية على طلب:
• العميل: <b>${requestData.name}</b>
• وسيلة التواصل: <code>${requestData.contact}</code>
• الطراز: <b>${requestData.device_model || 'Unknown'}</b>
• كود الطلب: <code>${requestId}</code>
━━━━━━━━━━━━━━━━━━━━━
🚀 <b>حالة المنصة:</b> انفتحت المنصة الآن لجهاز العميل فورياً!`
      : `❌ <b>[تم رفض طلب الوصول]</b>
━━━━━━━━━━━━━━━━━━━━━
قام <b>الرئيس التنفيذي محمد مطعني</b> برفض طلب:
• العميل: <b>${requestData.name}</b>
• كود الطلب: <code>${requestId}</code>`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: PRIMARY_CHAT_ID,
        text: actionNotice,
        parse_mode: 'HTML',
      }),
    }).catch(() => {});

    // 4. Return Ultra-High-End VIP HTML Page to Mohamed Matany's Browser
    const statusColor = isApproved ? '#00f2fe' : '#ef4444';
    const statusIcon = isApproved ? '👑' : '🛑';
    const titleText = isApproved ? 'تم منح الوصول بنجاح!' : 'تم رفض الطلب';
    const subtitleText = isApproved
      ? `تم تفعيل ترخيص الوصول السيادي للمستخدم <strong>${requestData.name}</strong>، وانفتحت له المنصة رسمياً على جهازه الآن.`
      : `تم رفض الطلب رقم ${requestId}.`;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} • CEO Mohamed Matany</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: #030306;
      color: #fff;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    .glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, ${isApproved ? 'rgba(0,242,254,0.15)' : 'rgba(239,68,68,0.15)'} 0%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
    }
    .card {
      position: relative;
      z-index: 10;
      max-width: 460px;
      width: 90%;
      background: rgba(13, 17, 28, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.2);
      backdrop-filter: blur(24px);
      border-radius: 28px;
      padding: 36px 28px;
      text-align: center;
      box-sizing: border-box;
    }
    .icon-badge {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 2px solid ${statusColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 30px ${statusColor}40;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 24px;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.5px;
    }
    p {
      margin: 0 0 24px;
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.7;
    }
    .details {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: right;
      font-size: 13px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
    }
    .val {
      color: #f1f5f9;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 16px;
      background: ${isApproved ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : '#334155'};
      color: ${isApproved ? '#030306' : '#fff'};
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      box-sizing: border-box;
      transition: transform 0.2s, opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.92;
      transform: scale(1.01);
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="card">
    <div class="icon-badge">${statusIcon}</div>
    <h1>${titleText}</h1>
    <p>${subtitleText}</p>

    <div class="details">
      <div class="details-row">
        <span class="label">اسم العميل:</span>
        <span class="val">${requestData.name}</span>
      </div>
      <div class="details-row">
        <span class="label">وسيلة التواصل:</span>
        <span class="val" dir="ltr">${requestData.contact}</span>
      </div>
      <div class="details-row">
        <span class="label">الجهاز:</span>
        <span class="val">${requestData.device_model || 'جهاز ذكي'}</span>
      </div>
      <div class="details-row">
        <span class="label">رقم الطلب:</span>
        <span class="val" dir="ltr"><code>${requestId}</code></span>
      </div>
      <div class="details-row">
        <span class="label">الجهة المعتمدة:</span>
        <span class="val">الرئيس التنفيذي محمد مطعني 👑</span>
      </div>
    </div>

    <a href="https://matany.one" class="btn">العودة إلى Matany.one</a>
  </div>
</body>
</html>
`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('[Action Error]:', err);
    return new Response('حدث خطأ أثناء معالجة الطلب.', { status: 500 });
  }
}
