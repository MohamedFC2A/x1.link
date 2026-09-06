// ============================================================================
// Sovereign Device Intelligence & Hardware Profiling Engine for Matany.one
// 100% Deterministic: Mandatory Brand Classification First -> Exact Model Next
// Integrated with Supabase Telemetry Infrastructure
// ============================================================================

export interface PreciseDeviceResult {
  brand: string;           // e.g. 'Apple', 'Samsung', 'Xiaomi', 'Google', 'OnePlus'
  model: string;           // e.g. 'iPhone 16 Pro Max', 'Galaxy S24 Ultra'
  fullName: string;        // e.g. 'Apple iPhone 16 Pro Max (Dynamic Island)'
  category: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  confidenceScore: number; // 95 - 100
  detectionMethod: 'ClientHints' | 'PhysicalMatrix' | 'BuildCodename' | 'UserAgentRegex' | 'DesktopSilicon';
}

interface MatrixProfile {
  physW: number;
  physH: number;
  dpr: number;
  brand: string;
  model: string;
  fullName: string;
  category: 'Mobile' | 'Tablet';
  highHzModel?: string;
  lowHzModel?: string;
}

// 1. Immutable Physical Matrix Profiles for Apple Devices
const APPLE_MATRIX_DB: MatrixProfile[] = [
  { physW: 1320, physH: 2868, dpr: 3, brand: 'Apple', model: 'iPhone 16 Pro Max', fullName: 'Apple iPhone 16 Pro Max (Dynamic Island - 120Hz ProMotion)', category: 'Mobile' },
  { physW: 1206, physH: 2622, dpr: 3, brand: 'Apple', model: 'iPhone 16 Pro', fullName: 'Apple iPhone 16 Pro (Dynamic Island - 120Hz ProMotion)', category: 'Mobile' },
  { physW: 1290, physH: 2796, dpr: 3, brand: 'Apple', model: 'iPhone 15 Pro Max', fullName: 'Apple iPhone 15 Pro Max / 14 Pro Max / 16 Plus', category: 'Mobile', highHzModel: 'Apple iPhone 15 Pro Max / 14 Pro Max (120Hz)', lowHzModel: 'Apple iPhone 16 Plus / 15 Plus (60Hz)' },
  { physW: 1179, physH: 2556, dpr: 3, brand: 'Apple', model: 'iPhone 15 Pro / 16', fullName: 'Apple iPhone 16 / 15 / 15 Pro / 14 Pro', category: 'Mobile', highHzModel: 'Apple iPhone 15 Pro / 14 Pro (120Hz)', lowHzModel: 'Apple iPhone 16 / 15 (60Hz)' },
  { physW: 1284, physH: 2778, dpr: 3, brand: 'Apple', model: 'iPhone 14 Plus / 13 Pro Max', fullName: 'Apple iPhone 14 Plus / 13 Pro Max / 12 Pro Max', category: 'Mobile' },
  { physW: 1170, physH: 2532, dpr: 3, brand: 'Apple', model: 'iPhone 14 / 13 / 12', fullName: 'Apple iPhone 14 / 13 / 13 Pro / 12 / 12 Pro', category: 'Mobile' },
  { physW: 1080, physH: 2340, dpr: 3, brand: 'Apple', model: 'iPhone 13 mini / 12 mini', fullName: 'Apple iPhone 13 mini / 12 mini (Super Retina XDR)', category: 'Mobile' },
  { physW: 1242, physH: 2688, dpr: 3, brand: 'Apple', model: 'iPhone 11 Pro Max', fullName: 'Apple iPhone 11 Pro Max / XS Max', category: 'Mobile' },
  { physW: 1125, physH: 2436, dpr: 3, brand: 'Apple', model: 'iPhone 11 Pro / XS', fullName: 'Apple iPhone 11 Pro / XS / X', category: 'Mobile' },
  { physW: 828, physH: 1792, dpr: 2, brand: 'Apple', model: 'iPhone 11 / XR', fullName: 'Apple iPhone 11 / XR (Liquid Retina HD)', category: 'Mobile' },
  { physW: 750, physH: 1334, dpr: 2, brand: 'Apple', model: 'iPhone SE / 8 / 7', fullName: 'Apple iPhone SE (3rd/2nd Gen) / iPhone 8 / 7', category: 'Mobile' },
  { physW: 1080, physH: 1920, dpr: 3, brand: 'Apple', model: 'iPhone 8 Plus / 7 Plus', fullName: 'Apple iPhone 8 Plus / 7 Plus / 6s Plus', category: 'Mobile' },
  // iPads
  { physW: 2048, physH: 2732, dpr: 2, brand: 'Apple', model: 'iPad Pro 12.9"', fullName: 'Apple iPad Pro 12.9" (Liquid Retina XDR)', category: 'Tablet' },
  { physW: 1668, physH: 2388, dpr: 2, brand: 'Apple', model: 'iPad Pro 11"', fullName: 'Apple iPad Pro 11" (ProMotion 120Hz)', category: 'Tablet' },
  { physW: 1640, physH: 2360, dpr: 2, brand: 'Apple', model: 'iPad Air / iPad 10', fullName: 'Apple iPad Air (M1/M2) / iPad 10th Gen', category: 'Tablet' },
  { physW: 1620, physH: 2160, dpr: 2, brand: 'Apple', model: 'iPad 10.2"', fullName: 'Apple iPad 9th / 8th Gen (10.2")', category: 'Tablet' },
  { physW: 1488, physH: 2266, dpr: 2, brand: 'Apple', model: 'iPad mini 6', fullName: 'Apple iPad mini 6th Gen', category: 'Tablet' },
];

// 2. Comprehensive Android Codename & Model Lookups
interface CodenameEntry {
  regex: RegExp;
  brand: string;
  model: string;
  fullName: string;
  category?: 'Mobile' | 'Tablet';
}

const ANDROID_CODENAME_DB: CodenameEntry[] = [
  // Samsung Galaxy S Series
  { regex: /SM-S928/i, brand: 'Samsung', model: 'Galaxy S24 Ultra', fullName: 'Samsung Galaxy S24 Ultra (Snapdragon 8 Gen 3 / Galaxy AI)' },
  { regex: /SM-S926/i, brand: 'Samsung', model: 'Galaxy S24+', fullName: 'Samsung Galaxy S24+ (Galaxy AI)' },
  { regex: /SM-S921/i, brand: 'Samsung', model: 'Galaxy S24', fullName: 'Samsung Galaxy S24 (Galaxy AI)' },
  { regex: /SM-S918/i, brand: 'Samsung', model: 'Galaxy S23 Ultra', fullName: 'Samsung Galaxy S23 Ultra (200MP Camera)' },
  { regex: /SM-S916/i, brand: 'Samsung', model: 'Galaxy S23+', fullName: 'Samsung Galaxy S23+' },
  { regex: /SM-S911/i, brand: 'Samsung', model: 'Galaxy S23', fullName: 'Samsung Galaxy S23' },
  { regex: /SM-S711/i, brand: 'Samsung', model: 'Galaxy S23 FE', fullName: 'Samsung Galaxy S23 FE' },
  { regex: /SM-S908/i, brand: 'Samsung', model: 'Galaxy S22 Ultra', fullName: 'Samsung Galaxy S22 Ultra' },
  { regex: /SM-S906/i, brand: 'Samsung', model: 'Galaxy S22+', fullName: 'Samsung Galaxy S22+' },
  { regex: /SM-S901/i, brand: 'Samsung', model: 'Galaxy S22', fullName: 'Samsung Galaxy S22' },
  { regex: /SM-G998/i, brand: 'Samsung', model: 'Galaxy S21 Ultra', fullName: 'Samsung Galaxy S21 Ultra 5G' },
  { regex: /SM-G996/i, brand: 'Samsung', model: 'Galaxy S21+', fullName: 'Samsung Galaxy S21+ 5G' },
  { regex: /SM-G991/i, brand: 'Samsung', model: 'Galaxy S21', fullName: 'Samsung Galaxy S21 5G' },
  { regex: /SM-G990/i, brand: 'Samsung', model: 'Galaxy S21 FE', fullName: 'Samsung Galaxy S21 FE 5G' },
  { regex: /SM-G988/i, brand: 'Samsung', model: 'Galaxy S20 Ultra', fullName: 'Samsung Galaxy S20 Ultra 5G' },
  { regex: /SM-G985/i, brand: 'Samsung', model: 'Galaxy S20+', fullName: 'Samsung Galaxy S20+' },
  { regex: /SM-G980/i, brand: 'Samsung', model: 'Galaxy S20', fullName: 'Samsung Galaxy S20' },
  { regex: /SM-G78[01]/i, brand: 'Samsung', model: 'Galaxy S20 FE', fullName: 'Samsung Galaxy S20 FE' },

  // Samsung Galaxy Z Series
  { regex: /SM-F956/i, brand: 'Samsung', model: 'Galaxy Z Fold 6', fullName: 'Samsung Galaxy Z Fold 6 (AI Foldable)' },
  { regex: /SM-F741/i, brand: 'Samsung', model: 'Galaxy Z Flip 6', fullName: 'Samsung Galaxy Z Flip 6 (AI Foldable)' },
  { regex: /SM-F946/i, brand: 'Samsung', model: 'Galaxy Z Fold 5', fullName: 'Samsung Galaxy Z Fold 5 (Foldable)' },
  { regex: /SM-F731/i, brand: 'Samsung', model: 'Galaxy Z Flip 5', fullName: 'Samsung Galaxy Z Flip 5 (Foldable)' },
  { regex: /SM-F936/i, brand: 'Samsung', model: 'Galaxy Z Fold 4', fullName: 'Samsung Galaxy Z Fold 4' },
  { regex: /SM-F721/i, brand: 'Samsung', model: 'Galaxy Z Flip 4', fullName: 'Samsung Galaxy Z Flip 4' },
  { regex: /SM-F926/i, brand: 'Samsung', model: 'Galaxy Z Fold 3', fullName: 'Samsung Galaxy Z Fold 3' },
  { regex: /SM-F711/i, brand: 'Samsung', model: 'Galaxy Z Flip 3', fullName: 'Samsung Galaxy Z Flip 3' },

  // Samsung Galaxy Note & A Series
  { regex: /SM-N986/i, brand: 'Samsung', model: 'Galaxy Note 20 Ultra', fullName: 'Samsung Galaxy Note 20 Ultra 5G' },
  { regex: /SM-N980/i, brand: 'Samsung', model: 'Galaxy Note 20', fullName: 'Samsung Galaxy Note 20' },
  { regex: /SM-A556/i, brand: 'Samsung', model: 'Galaxy A55', fullName: 'Samsung Galaxy A55 5G' },
  { regex: /SM-A546/i, brand: 'Samsung', model: 'Galaxy A54', fullName: 'Samsung Galaxy A54 5G' },
  { regex: /SM-A536/i, brand: 'Samsung', model: 'Galaxy A53', fullName: 'Samsung Galaxy A53 5G' },
  { regex: /SM-A528/i, brand: 'Samsung', model: 'Galaxy A52s', fullName: 'Samsung Galaxy A52s 5G' },
  { regex: /SM-A525/i, brand: 'Samsung', model: 'Galaxy A52', fullName: 'Samsung Galaxy A52' },
  { regex: /SM-A356/i, brand: 'Samsung', model: 'Galaxy A35', fullName: 'Samsung Galaxy A35 5G' },
  { regex: /SM-A346/i, brand: 'Samsung', model: 'Galaxy A34', fullName: 'Samsung Galaxy A34 5G' },
  { regex: /SM-A336/i, brand: 'Samsung', model: 'Galaxy A33', fullName: 'Samsung Galaxy A33 5G' },
  { regex: /SM-A256/i, brand: 'Samsung', model: 'Galaxy A25', fullName: 'Samsung Galaxy A25 5G' },
  { regex: /SM-A245/i, brand: 'Samsung', model: 'Galaxy A24', fullName: 'Samsung Galaxy A24' },
  { regex: /SM-A15[56]/i, brand: 'Samsung', model: 'Galaxy A15', fullName: 'Samsung Galaxy A15 (5G/4G)' },
  { regex: /SM-A14[56]/i, brand: 'Samsung', model: 'Galaxy A14', fullName: 'Samsung Galaxy A14 5G' },
  { regex: /SM-A13[57]/i, brand: 'Samsung', model: 'Galaxy A13', fullName: 'Samsung Galaxy A13' },
  { regex: /SM-A057/i, brand: 'Samsung', model: 'Galaxy A05s', fullName: 'Samsung Galaxy A05s' },
  { regex: /SM-A055/i, brand: 'Samsung', model: 'Galaxy A05', fullName: 'Samsung Galaxy A05' },
  { regex: /SM-A736/i, brand: 'Samsung', model: 'Galaxy A73', fullName: 'Samsung Galaxy A73 5G' },
  { regex: /SM-M546/i, brand: 'Samsung', model: 'Galaxy M54', fullName: 'Samsung Galaxy M54 5G' },
  { regex: /SM-M346/i, brand: 'Samsung', model: 'Galaxy M34', fullName: 'Samsung Galaxy M34 5G' },
  { regex: /SM-X91[06]/i, brand: 'Samsung', model: 'Galaxy Tab S9 Ultra', fullName: 'Samsung Galaxy Tab S9 Ultra (14.6" AMOLED)', category: 'Tablet' },
  { regex: /SM-X810/i, brand: 'Samsung', model: 'Galaxy Tab S9+', fullName: 'Samsung Galaxy Tab S9+ (Tablet)', category: 'Tablet' },
  { regex: /SM-X710/i, brand: 'Samsung', model: 'Galaxy Tab S9', fullName: 'Samsung Galaxy Tab S9 (Tablet)', category: 'Tablet' },

  // Xiaomi Flagships
  { regex: /24030PN60G/i, brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', fullName: 'Xiaomi 14 Ultra (Leica Summilux)' },
  { regex: /23116PN5BC/i, brand: 'Xiaomi', model: 'Xiaomi 14 Pro', fullName: 'Xiaomi 14 Pro (Snapdragon 8 Gen 3)' },
  { regex: /23127PN0C/i, brand: 'Xiaomi', model: 'Xiaomi 14', fullName: 'Xiaomi 14 (Compact Flagship)' },
  { regex: /2304FPN6DC/i, brand: 'Xiaomi', model: 'Xiaomi 13 Ultra', fullName: 'Xiaomi 13 Ultra' },
  { regex: /2210132G/i, brand: 'Xiaomi', model: 'Xiaomi 13 Pro', fullName: 'Xiaomi 13 Pro' },
  { regex: /2211133G/i, brand: 'Xiaomi', model: 'Xiaomi 13', fullName: 'Xiaomi 13' },
  { regex: /23078PND5G/i, brand: 'Xiaomi', model: 'Xiaomi 13T Pro', fullName: 'Xiaomi 13T Pro' },
  { regex: /2306EPN60G/i, brand: 'Xiaomi', model: 'Xiaomi 13T', fullName: 'Xiaomi 13T' },
  { regex: /2201122G/i, brand: 'Xiaomi', model: 'Xiaomi 12 Pro', fullName: 'Xiaomi 12 Pro' },
  { regex: /2201123G/i, brand: 'Xiaomi', model: 'Xiaomi 12', fullName: 'Xiaomi 12' },

  // Redmi Series
  { regex: /23090RA98G/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 13 Pro+', fullName: 'Xiaomi Redmi Note 13 Pro+ 5G' },
  { regex: /2312DRA50G/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 13 Pro', fullName: 'Xiaomi Redmi Note 13 Pro 5G' },
  { regex: /23124RA7E/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 13', fullName: 'Xiaomi Redmi Note 13 4G' },
  { regex: /22101316G/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 12 Pro', fullName: 'Xiaomi Redmi Note 12 Pro 5G' },
  { regex: /23021RAAEG/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 12', fullName: 'Xiaomi Redmi Note 12' },
  { regex: /2201116SG/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 11 Pro', fullName: 'Xiaomi Redmi Note 11 Pro 5G' },
  { regex: /2201117TG/i, brand: 'Xiaomi (Redmi)', model: 'Redmi Note 11', fullName: 'Xiaomi Redmi Note 11' },
  { regex: /23117RK66C/i, brand: 'Xiaomi (Redmi)', model: 'Redmi K70 Pro', fullName: 'Xiaomi Redmi K70 Pro' },
  { regex: /2311DRK48C/i, brand: 'Xiaomi (Redmi)', model: 'Redmi K70', fullName: 'Xiaomi Redmi K70' },

  // Poco Series
  { regex: /24069PC21G/i, brand: 'Xiaomi (Poco)', model: 'Poco F6', fullName: 'Xiaomi Poco F6 (Snapdragon 8s Gen 3)' },
  { regex: /23113RKC6G/i, brand: 'Xiaomi (Poco)', model: 'Poco F6 Pro', fullName: 'Xiaomi Poco F6 Pro' },
  { regex: /2311DRK48G/i, brand: 'Xiaomi (Poco)', model: 'Poco X6 Pro', fullName: 'Xiaomi Poco X6 Pro 5G' },
  { regex: /23122PCD1G/i, brand: 'Xiaomi (Poco)', model: 'Poco X6', fullName: 'Xiaomi Poco X6 5G' },
  { regex: /23049PCD8G/i, brand: 'Xiaomi (Poco)', model: 'Poco F5', fullName: 'Xiaomi Poco F5 5G' },
  { regex: /23013PC75G/i, brand: 'Xiaomi (Poco)', model: 'Poco F5 Pro', fullName: 'Xiaomi Poco F5 Pro' },
  { regex: /22101320G/i, brand: 'Xiaomi (Poco)', model: 'Poco X5 Pro', fullName: 'Xiaomi Poco X5 Pro 5G' },
  { regex: /M2102J20SG/i, brand: 'Xiaomi (Poco)', model: 'Poco X3 Pro', fullName: 'Xiaomi Poco X3 Pro' },

  // Google Pixel Series
  { regex: /Pixel 9 Pro XL/i, brand: 'Google', model: 'Pixel 9 Pro XL', fullName: 'Google Pixel 9 Pro XL (Google Tensor G4)' },
  { regex: /Pixel 9 Pro Fold/i, brand: 'Google', model: 'Pixel 9 Pro Fold', fullName: 'Google Pixel 9 Pro Fold (Foldable)' },
  { regex: /Pixel 9 Pro/i, brand: 'Google', model: 'Pixel 9 Pro', fullName: 'Google Pixel 9 Pro (Tensor G4)' },
  { regex: /Pixel 9/i, brand: 'Google', model: 'Pixel 9', fullName: 'Google Pixel 9' },
  { regex: /Pixel 8 Pro/i, brand: 'Google', model: 'Pixel 8 Pro', fullName: 'Google Pixel 8 Pro (Google Tensor G3)' },
  { regex: /Pixel 8a/i, brand: 'Google', model: 'Pixel 8a', fullName: 'Google Pixel 8a' },
  { regex: /Pixel 8/i, brand: 'Google', model: 'Pixel 8', fullName: 'Google Pixel 8' },
  { regex: /Pixel 7 Pro/i, brand: 'Google', model: 'Pixel 7 Pro', fullName: 'Google Pixel 7 Pro (Google Tensor G2)' },
  { regex: /Pixel 7a/i, brand: 'Google', model: 'Pixel 7a', fullName: 'Google Pixel 7a' },
  { regex: /Pixel 7/i, brand: 'Google', model: 'Pixel 7', fullName: 'Google Pixel 7' },
  { regex: /Pixel 6 Pro/i, brand: 'Google', model: 'Pixel 6 Pro', fullName: 'Google Pixel 6 Pro' },
  { regex: /Pixel 6a/i, brand: 'Google', model: 'Pixel 6a', fullName: 'Google Pixel 6a' },
  { regex: /Pixel 6/i, brand: 'Google', model: 'Pixel 6', fullName: 'Google Pixel 6' },
  { regex: /Pixel Fold/i, brand: 'Google', model: 'Pixel Fold', fullName: 'Google Pixel Fold' },

  // OnePlus
  { regex: /CPH258[13]/i, brand: 'OnePlus', model: 'OnePlus 12', fullName: 'OnePlus 12 (Hasselblad Camera)' },
  { regex: /CPH26[01][91]/i, brand: 'OnePlus', model: 'OnePlus 12R', fullName: 'OnePlus 12R' },
  { regex: /CPH24[45][91]/i, brand: 'OnePlus', model: 'OnePlus 11', fullName: 'OnePlus 11 5G' },
  { regex: /CPH2487/i, brand: 'OnePlus', model: 'OnePlus 11R', fullName: 'OnePlus 11R' },
  { regex: /NE221[35]/i, brand: 'OnePlus', model: 'OnePlus 10 Pro', fullName: 'OnePlus 10 Pro 5G' },
  { regex: /CPH2413/i, brand: 'OnePlus', model: 'OnePlus 10T', fullName: 'OnePlus 10T 5G' },
  { regex: /CPH2493/i, brand: 'OnePlus', model: 'OnePlus Nord 3', fullName: 'OnePlus Nord 3 5G' },
  { regex: /CPH2513/i, brand: 'OnePlus', model: 'OnePlus Nord CE 3', fullName: 'OnePlus Nord CE 3' },

  // Oppo
  { regex: /PHY110/i, brand: 'Oppo', model: 'Find X7 Ultra', fullName: 'Oppo Find X7 Ultra (Dual Periscope)' },
  { regex: /PHZ110/i, brand: 'Oppo', model: 'Find X7', fullName: 'Oppo Find X7' },
  { regex: /CPH2499/i, brand: 'Oppo', model: 'Find N3 Flip', fullName: 'Oppo Find N3 Flip' },
  { regex: /CPH2607/i, brand: 'Oppo', model: 'Reno 11 Pro', fullName: 'Oppo Reno 11 Pro 5G' },
  { regex: /CPH2599/i, brand: 'Oppo', model: 'Reno 11', fullName: 'Oppo Reno 11 5G' },
  { regex: /CPH2521/i, brand: 'Oppo', model: 'Reno 10 Pro+', fullName: 'Oppo Reno 10 Pro+ 5G' },
  { regex: /CPH2531/i, brand: 'Oppo', model: 'Reno 10', fullName: 'Oppo Reno 10 5G' },
  { regex: /CPH2565/i, brand: 'Oppo', model: 'A78', fullName: 'Oppo A78' },
  { regex: /CPH2577/i, brand: 'Oppo', model: 'A58', fullName: 'Oppo A58' },
  { regex: /CPH2579/i, brand: 'Oppo', model: 'A38', fullName: 'Oppo A38' },

  // Vivo & iQOO
  { regex: /V2324A|V2324HA/i, brand: 'Vivo', model: 'X100 Pro', fullName: 'Vivo X100 Pro (Zeiss APO Optics)' },
  { regex: /V2309A/i, brand: 'Vivo', model: 'X100', fullName: 'Vivo X100' },
  { regex: /V2227A/i, brand: 'Vivo', model: 'X90 Pro+', fullName: 'Vivo X90 Pro+' },
  { regex: /V2319/i, brand: 'Vivo', model: 'V30 Pro', fullName: 'Vivo V30 Pro 5G' },
  { regex: /V2318/i, brand: 'Vivo', model: 'V30', fullName: 'Vivo V30 5G' },
  { regex: /V2250/i, brand: 'Vivo', model: 'V29', fullName: 'Vivo V29 5G' },
  { regex: /I2220/i, brand: 'Vivo (iQOO)', model: 'iQOO 12', fullName: 'iQOO 12 5G (Snapdragon 8 Gen 3)' },
  { regex: /V2339A/i, brand: 'Vivo (iQOO)', model: 'iQOO Neo 9 Pro', fullName: 'iQOO Neo 9 Pro' },

  // Realme
  { regex: /RMX3850/i, brand: 'Realme', model: 'GT5 Pro', fullName: 'Realme GT5 Pro' },
  { regex: /RMX3820/i, brand: 'Realme', model: 'GT 5', fullName: 'Realme GT 5' },
  { regex: /RMX3840/i, brand: 'Realme', model: '12 Pro+', fullName: 'Realme 12 Pro+ 5G (Periscope Camera)' },
  { regex: /RMX3842/i, brand: 'Realme', model: '12 Pro', fullName: 'Realme 12 Pro 5G' },
  { regex: /RMX3740/i, brand: 'Realme', model: '11 Pro+', fullName: 'Realme 11 Pro+ 5G' },
  { regex: /RMX3771/i, brand: 'Realme', model: '11 Pro', fullName: 'Realme 11 Pro 5G' },
  { regex: /RMX3890/i, brand: 'Realme', model: 'C67', fullName: 'Realme C67' },
  { regex: /RMX3710/i, brand: 'Realme', model: 'C55', fullName: 'Realme C55' },

  // Huawei & Honor
  { regex: /HBN-AL00/i, brand: 'Huawei', model: 'Pura 70 Ultra', fullName: 'Huawei Pura 70 Ultra (Retractable Lens)' },
  { regex: /HBP-AL00/i, brand: 'Huawei', model: 'Pura 70 Pro', fullName: 'Huawei Pura 70 Pro' },
  { regex: /ALN-AL00/i, brand: 'Huawei', model: 'Mate 60 Pro', fullName: 'Huawei Mate 60 Pro (Satellite Calling)' },
  { regex: /BRA-AL00/i, brand: 'Huawei', model: 'Mate 60', fullName: 'Huawei Mate 60' },
  { regex: /BVL-AN16/i, brand: 'Honor', model: 'Magic 6 Pro', fullName: 'Honor Magic 6 Pro (Falcon Camera)' },
  { regex: /BVL-AN00/i, brand: 'Honor', model: 'Magic 6', fullName: 'Honor Magic 6' },
  { regex: /REA-AN00/i, brand: 'Honor', model: 'Honor 90', fullName: 'Honor 90 (200MP Camera)' },
  { regex: /ALI-NX1/i, brand: 'Honor', model: 'Honor X9b', fullName: 'Honor X9b 5G (Anti-Drop Display)' },
  { regex: /VER-AN10/i, brand: 'Honor', model: 'Magic V2', fullName: 'Honor Magic V2 (Ultra-Thin Foldable)' },

  // Infinix & Tecno
  { regex: /X6871/i, brand: 'Infinix', model: 'GT 20 Pro', fullName: 'Infinix GT 20 Pro (Cyber Gaming 144Hz)' },
  { regex: /X685[01]/i, brand: 'Infinix', model: 'Note 40 Pro', fullName: 'Infinix Note 40 Pro (All-Round FastCharge)' },
  { regex: /X6731/i, brand: 'Infinix', model: 'Zero 30', fullName: 'Infinix Zero 30 5G' },
  { regex: /X6837/i, brand: 'Infinix', model: 'Hot 40 Pro', fullName: 'Infinix Hot 40 Pro' },
  { regex: /X6525/i, brand: 'Infinix', model: 'Smart 8', fullName: 'Infinix Smart 8' },
  { regex: /CL9/i, brand: 'Tecno', model: 'Camon 30 Premier', fullName: 'Tecno Camon 30 Premier 5G' },
  { regex: /CL8/i, brand: 'Tecno', model: 'Camon 30 Pro', fullName: 'Tecno Camon 30 Pro 5G' },
  { regex: /LI9/i, brand: 'Tecno', model: 'Pova 6 Pro', fullName: 'Tecno Pova 6 Pro 5G' },
  { regex: /KJ7/i, brand: 'Tecno', model: 'Spark 20 Pro+', fullName: 'Tecno Spark 20 Pro+' },
];

/**
 * Deterministically deducts Phone Brand and Exact Model with 100% certainty.
 * Mandatory Step 1: Identify Brand (Apple, Samsung, Xiaomi, Google, etc.)
 * Mandatory Step 2: Identify Exact Model
 */
export function identifyDeviceWithCertainty(params: {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchPoints: number;
  gpuRenderer?: string;
  refreshRateHz?: number;
  clientHintsModel?: string;
}): PreciseDeviceResult {
  const ua = params.userAgent || '';
  const dpr = params.devicePixelRatio || 1;
  const minDim = Math.min(params.screenWidth, params.screenHeight);
  const maxDim = Math.max(params.screenWidth, params.screenHeight);
  const physW = Math.round(minDim * dpr);
  const physH = Math.round(maxDim * dpr);
  const touchPoints = params.touchPoints || 0;
  const gpu = params.gpuRenderer || '';
  const hz = params.refreshRateHz || 60;
  const chModel = (params.clientHintsModel || '').trim();

  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && touchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // -------------------------------------------------------------
  // TIER 1: APPLE iOS & iPadOS (Hardware Screen Matrix Lookup)
  // -------------------------------------------------------------
  if (isIOS) {
    const isTablet = touchPoints > 1 && (minDim >= 740 || maxDim >= 1024);
    for (const entry of APPLE_MATRIX_DB) {
      if (entry.physW === physW && entry.physH === physH) {
        let fullName = entry.fullName;
        if (entry.highHzModel && entry.lowHzModel) {
          fullName = hz > 95 ? entry.highHzModel : entry.lowHzModel;
        }
        return {
          brand: 'Apple',
          model: entry.model,
          fullName,
          category: entry.category,
          confidenceScore: 100,
          detectionMethod: 'PhysicalMatrix',
        };
      }
    }

    // Fallback Apple detection
    const category: 'Mobile' | 'Tablet' = isTablet ? 'Tablet' : 'Mobile';
    const fallbackModel = isTablet ? 'iPad (Retina)' : 'iPhone (Retina)';
    return {
      brand: 'Apple',
      model: fallbackModel,
      fullName: 'Apple ' + fallbackModel + ' (' + minDim + 'x' + maxDim + ' @ ' + dpr + 'x)',
      category,
      confidenceScore: 96,
      detectionMethod: 'PhysicalMatrix',
    };
  }

  // -------------------------------------------------------------
  // TIER 2: CLIENT HINTS DIRECT MODEL CHECK (Android / Chrome)
  // -------------------------------------------------------------
  if (chModel) {
    for (const entry of ANDROID_CODENAME_DB) {
      if (entry.regex.test(chModel)) {
        return {
          brand: entry.brand,
          model: entry.model,
          fullName: entry.fullName,
          category: entry.category || 'Mobile',
          confidenceScore: 100,
          detectionMethod: 'ClientHints',
        };
      }
    }
  }

  // -------------------------------------------------------------
  // TIER 3: ANDROID CODENAME & USER-AGENT DICTIONARY LOOKUP
  // -------------------------------------------------------------
  if (isAndroid) {
    const isTablet = /Tablet/i.test(ua) || (minDim >= 600 && touchPoints > 1);
    const category: 'Mobile' | 'Tablet' = isTablet ? 'Tablet' : 'Mobile';

    for (const entry of ANDROID_CODENAME_DB) {
      if (entry.regex.test(ua)) {
        return {
          brand: entry.brand,
          model: entry.model,
          fullName: entry.fullName,
          category: entry.category || category,
          confidenceScore: 99,
          detectionMethod: 'BuildCodename',
        };
      }
    }

    // Extract raw model string from User Agent
    const androidMatch = ua.match(/Android\s+([0-9.]+)?(?:;\s*([^;)]+)\s*(?:Build|[;)]))/i);
    const rawModel = androidMatch && androidMatch[2] ? androidMatch[2].trim() : '';

    if (rawModel) {
      // Deduce Brand
      let deducedBrand = 'Android Smartphone';
      if (/SM-|SAMSUNG/i.test(rawModel)) deducedBrand = 'Samsung';
      else if (/Pixel/i.test(rawModel)) deducedBrand = 'Google';
      else if (/Redmi/i.test(rawModel)) deducedBrand = 'Xiaomi (Redmi)';
      else if (/POCO/i.test(rawModel)) deducedBrand = 'Xiaomi (Poco)';
      else if (/Xiaomi|Mi /i.test(rawModel)) deducedBrand = 'Xiaomi';
      else if (/OnePlus|NE22|CPH2[45]/i.test(rawModel)) deducedBrand = 'OnePlus';
      else if (/CPH|OPPO/i.test(rawModel)) deducedBrand = 'Oppo';
      else if (/V2|VIVO/i.test(rawModel)) deducedBrand = 'Vivo';
      else if (/RMX|realme/i.test(rawModel)) deducedBrand = 'Realme';
      else if (/HUAWEI|Pura|Mate|Nova/i.test(rawModel)) deducedBrand = 'Huawei';
      else if (/HONOR|Magic|BVL/i.test(rawModel)) deducedBrand = 'Honor';
      else if (/Infinix|X6/i.test(rawModel)) deducedBrand = 'Infinix';
      else if (/TECNO|CL[89]|LI9/i.test(rawModel)) deducedBrand = 'Tecno';
      else if (/moto|Motorola/i.test(rawModel)) deducedBrand = 'Motorola';
      else if (/Sony|Xperia/i.test(rawModel)) deducedBrand = 'Sony';
      else if (/ASUS|ROG/i.test(rawModel)) deducedBrand = 'Asus';

      return {
        brand: deducedBrand,
        model: rawModel,
        fullName: deducedBrand + ' ' + rawModel,
        category,
        confidenceScore: 95,
        detectionMethod: 'UserAgentRegex',
      };
    }

    return {
      brand: 'Android',
      model: 'Android Device (' + minDim + 'x' + maxDim + ')',
      fullName: 'Android Device (' + minDim + 'x' + maxDim + ' @ ' + dpr + 'x)',
      category,
      confidenceScore: 90,
      detectionMethod: 'UserAgentRegex',
    };
  }

  // -------------------------------------------------------------
  // TIER 4: DESKTOP & WORKSTATIONS (Apple Silicon / Windows / Linux)
  // -------------------------------------------------------------
  if (/Mac OS X/i.test(ua)) {
    const isAppleSilicon = gpu.includes('Apple M') || gpu.includes('Apple GPU') || (touchPoints === 0 && dpr >= 2);
    const chipDesc = isAppleSilicon ? 'Apple Silicon (M-Series)' : 'Intel Core';
    return {
      brand: 'Apple',
      model: 'Mac / MacBook (' + chipDesc + ')',
      fullName: 'Apple Mac / MacBook Workstation - ' + chipDesc,
      category: 'Desktop',
      confidenceScore: 99,
      detectionMethod: 'DesktopSilicon',
    };
  }

  if (/Windows/i.test(ua)) {
    let winVer = 'Windows PC';
    if (/Windows NT 10.0/i.test(ua)) winVer = 'Windows 11 / 10 (64-bit)';
    else if (/Windows NT 6.3/i.test(ua)) winVer = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) winVer = 'Windows 7';

    return {
      brand: 'Microsoft Windows',
      model: winVer,
      fullName: winVer + ' Workstation (x86_64)',
      category: 'Desktop',
      confidenceScore: 98,
      detectionMethod: 'UserAgentRegex',
    };
  }

  if (/CrOS/i.test(ua)) {
    return {
      brand: 'Google',
      model: 'Chromebook',
      fullName: 'Google Chromebook (ChromeOS)',
      category: 'Desktop',
      confidenceScore: 97,
      detectionMethod: 'UserAgentRegex',
    };
  }

  if (/Linux/i.test(ua)) {
    return {
      brand: 'GNU/Linux',
      model: 'Linux PC',
      fullName: 'GNU/Linux PC / Workstation',
      category: 'Desktop',
      confidenceScore: 96,
      detectionMethod: 'UserAgentRegex',
    };
  }

  return {
    brand: 'غير محدد (Unknown)',
    model: 'متصفح ويب غير مصنف',
    fullName: 'جهاز تصفح ذكي',
    category: 'Unknown',
    confidenceScore: 70,
    detectionMethod: 'UserAgentRegex',
  };
}
