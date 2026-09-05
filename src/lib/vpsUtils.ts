/**
 * Sovereign VPS & Cloud Computer Intent Detection & Constants
 * Safe to import across Edge, Browser, and Node.js environments.
 */

export const VPS_STATUS_NOTICE = 'يتم الان الوصول للكمبيوتر والاوامر السحابية';

export function isVpsOrCloudRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('vps') ||
    lower.includes('104.207.77.162') ||
    lower.includes('سيرفر') ||
    lower.includes('السيرفر') ||
    lower.includes('الخادم') ||
    lower.includes('خادم') ||
    lower.includes('كمبيوتر سحابي') ||
    lower.includes('الكمبيوتر السحابي') ||
    lower.includes('اوامر سحابية') ||
    lower.includes('الأوامر السحابية') ||
    lower.includes('الاوامر السحابية') ||
    lower.includes('غرفة تحكم') ||
    lower.includes('غرفة التحكم') ||
    lower.includes('pm2') ||
    lower.includes('أوامر لينكس') ||
    lower.includes('اوامر لينكس') ||
    lower.includes('bash') ||
    lower.includes('شيل') ||
    lower.includes('طرفية') ||
    lower.includes('terminal') ||
    lower.includes('ubuntu') ||
    lower.includes('ssh') ||
    lower.includes('upstore-bot') ||
    lower.includes('upstore-promoter') ||
    lower.includes('upstore')
  );
}
