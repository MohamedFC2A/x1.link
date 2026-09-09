import { ModelType } from '../types';

export function getModelDisplayName(model?: string, isX1?: boolean): string {
  if (isX1) return 'matany.one (X1 MAX)';
  if (!model) return 'Fathom Quant 3';

  switch (model) {
    case 'fathom-quant-3':
      return 'Fathom Quant 3';
    case 'fathom-search':
      return 'Fathom Search';
    case 'deepseek-v4-flash':
      return 'Fathom 1.1';
    case 'deepseek-v4-flash-cyber-2.6':
      return 'Fathom Cyber Flash 2.6';
    case 'deepseek-v4-pro-cyber-2.6':
    case 'deepseek-v4-pro-cyber-2.1':
      return 'Fathom Cyber Ultra 2.6';
    case 'deepseek-v4-flash-cyber-2.1':
      return 'Fathom Cyber Flash 2.6';
    case 'deepseek-v4-flash-cyber':
      return 'Fathom Cyber';
    case 'deepseek-v4-flash-vision-exp':
      return 'Fathom Cam';
    case 'meta/muse-spark-1.2-contributor':
      return 'Fathom Spark';
    default:
      if (model.includes('search') || model.includes('fathom-search')) return 'Fathom Search';
      if (model.includes('quant-3') || model.includes('quant3')) return 'Fathom Quant 3';
      if (model.includes('pro-cyber') || model.includes('cyber-ultra') || model.includes('pro-cyper')) return 'Fathom Cyber Ultra 2.6';
      if (model.includes('flash-cyber') || model.includes('flash-cyper')) return 'Fathom Cyber Flash 2.6';
      if (model.includes('cyber') || model.includes('cyper')) return 'Fathom Cyber';
      if (model.includes('vision') || model.includes('cam')) return 'Fathom Cam';
      if (model.includes('spark')) return 'Fathom Spark';
      return 'Fathom 1.1';
  }
}

export function getModelSubtitle(model?: string, isX1?: boolean): string {
  if (isX1) {
    return 'وضع التحليل الحر غير المقيد للواقعية الموضوعية والنقد التحليلي الشامل';
  }
  switch (model) {
    case 'fathom-quant-3':
      return 'استدلال تحليلي فائق، توليد ومعالجة الصور بدقة عالية، والتحكم السحابي المتقدم';
    case 'fathom-search':
      return 'محرك البحث والاستقصاء المتشعب، واسترجاع الذاكرة العصبية وفحص وسائط الذكاء الاصطناعي';
    case 'deepseek-v4-pro-cyber-2.6':
    case 'deepseek-v4-pro-cyber-2.1':
      return 'نموذج الاستدلال العميق والتحليل الهندسي والأمني عالي الدقة';
    case 'deepseek-v4-flash-cyber-2.6':
    case 'deepseek-v4-flash-cyber-2.1':
      return 'استجابة سريعة متخصصة في التحليل الأمني والتقني الفوري';
    case 'deepseek-v4-flash-cyber':
      return 'تحليل أمني متقدم واستكشاف معماري للأهداف والشبكات';
    case 'deepseek-v4-flash-vision-exp':
      return 'تحليل الرؤية الحاسوبية وقراءة المستندات والبيانات البصرية';
    case 'meta/muse-spark-1.2-contributor':
      return 'معالجة الوسائط المتعددة: تفكيك وتحليل المقاطع الصوتية والمرئية';
    case 'deepseek-v4-flash':
    default:
      return 'معالجة لغوية متقدمة واستيعاب شامل للنصوص والاستفسارات';
  }
}

export function getModelPlaceholder(
  model?: string,
  isX1?: boolean,
  options?: {
    hasAttachments?: boolean;
    hasNonImageMedia?: boolean;
    isDeepSearch?: boolean;
    activeFusion?: { placeholder: string } | null;
  }
): string {
  if (options?.activeFusion?.placeholder) {
    return options.activeFusion.placeholder;
  }
  if (model === 'fathom-search' || options?.isDeepSearch) {
    return 'ابحث واستقصِ بذكاء عبر Fathom Search (استعلام حي، سياق، ذاكرة، وفحص وسائط)...';
  }
  if (options?.hasNonImageMedia) {
    return 'أرفق وسائط لتحليلها أو اكتب استفسارك هنا...';
  }
  if (options?.hasAttachments) {
    return 'أرفق صورة للتحليل البصري أو اكتب استفسارك هنا...';
  }
  if (isX1) {
    return 'اكتب استفسارك أو رسالتك هنا... (الوضع الحر)';
  }
  return 'اكتب استفسارك أو رسالتك هنا...';
}
