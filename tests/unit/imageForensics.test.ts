/**
 * Unit Tests: Image Forensics & AI Detection
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import {
  isForensicAnalysisRequested,
  buildForensicReportMarkdown
} from '../../server/imageForensicsService';

export async function runImageForensicsTests(harness: TestHarness) {
  await harness.describe('Image Forensics & AI Generation Detection Unit Tests', async () => {
    await harness.it('should detect explicit user requests for metadata and image forensics', () => {
      expect(isForensicAnalysisRequested('استخرج لي الميتاداتا وبيانات الكاميرا من هذه الصورة')).toBe(true);
      expect(isForensicAnalysisRequested('هل هذه الصورة حقيقية أم ذكاء اصطناعي؟')).toBe(true);
      expect(isForensicAnalysisRequested('exif camera settings and focal length')).toBe(true);
      expect(isForensicAnalysisRequested('ما رأيك في ألوان هذا الفستان؟')).toBe(false);
    });

    await harness.it('should generate markdown forensic report for AI-generated images', () => {
      const mockReport: any = {
        fileInfo: {
          detectedMimeType: 'image/png',
          md5Hash: 'e10adc3949ba59abbe56e057f20f883e',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        },
        authenticity: {
          verdict: 'AI-Generated Image (Synthetic Media)',
          verdictArabic: 'صورة مولدة بواسطة الذكاء الاصطناعي',
          overallAiConfidenceScore: 99.4,
          detectedGenerator: 'Midjourney v6',
          isDeterministicMatch: true,
          forensicBreakdownTable: [
            {
              layerNumber: 1,
              layerName: 'Cryptographic Provenance',
              status: 'FLAGGED',
              scoreContribution: '30%',
              indicators: ['SynthID watermark absent']
            }
          ],
          layer1Provenance: { hasC2PA: false, hasSynthID: false, hasInvisibleWatermark: false, indicators: [] },
          layer2Workflow: { generatorDetected: 'Midjourney v6', indicators: [] },
          layer3Signal: { prnuScoreNote: 'Synthetic noise distribution', fftScoreNote: 'High frequency grid decay', elaScoreNote: 'Uniform compression', indicators: [] },
          layer4DeepEnsemble: { vitProbabilityScore: 99.2, convnextProbabilityScore: 99.6, ensembleEnsembleScore: 99.4, indicators: [] },
          layer5VisualAnatomy: { lightingVectorCoherence: 45, specularReflectionSymmetry: 30, pupilAsymmetryDetected: true, indicators: [] }
        },
        device: { make: 'None', model: 'Synthetic Generator' },
        captureSettings: { iso: 0, shutterSpeed: '0', aperture: '0' },
        timestamps: { dateTimeOriginal: '2026-08-28 03:00:00' },
        gps: null,
        reverseGeocode: null,
        solarIntelligence: null,
        integrity: { reSaveDetected: false, metadataStripped: true },
        threat: { overallRisk: 'LOW', riskFactors: [], remediationAdvice: [] },
        rawExif: {}
      };

      const md = buildForensicReportMarkdown(mockReport);
      expect(md).toContain('تقرير التحليل الجنائي الرقمي');
      expect(md).toContain('Midjourney v6');
      expect(md).toContain('99.4%');
    });
  });
}
