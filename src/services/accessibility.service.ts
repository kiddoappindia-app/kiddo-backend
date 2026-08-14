import { Accessibility } from '../models/accessibility.model.js';

export class AccessibilityService {
  async getPreset(preset: string): Promise<any> {
    const presets: Record<string, any> = {
      default: { reducedMotion: false, largeFonts: false, highContrast: false, simpleMode: false, voiceGuidance: false, fontSize: 16, contrastLevel: 'normal', animationSpeed: 1 },
      reduced_motion: { reducedMotion: true, largeFonts: false, highContrast: false, simpleMode: false, voiceGuidance: false, fontSize: 16, contrastLevel: 'normal', animationSpeed: 0.5 },
      large_fonts: { reducedMotion: false, largeFonts: true, highContrast: false, simpleMode: false, voiceGuidance: false, fontSize: 24, contrastLevel: 'normal', animationSpeed: 1 },
      high_contrast: { reducedMotion: false, largeFonts: false, highContrast: true, simpleMode: false, voiceGuidance: false, fontSize: 16, contrastLevel: 'high', animationSpeed: 1 },
      simple_mode: { reducedMotion: true, largeFonts: true, highContrast: false, simpleMode: true, voiceGuidance: false, fontSize: 20, contrastLevel: 'normal', animationSpeed: 0.5 },
      voice_guidance: { reducedMotion: true, largeFonts: false, highContrast: false, simpleMode: false, voiceGuidance: true, fontSize: 16, contrastLevel: 'normal', animationSpeed: 0.5 },
    };
    return presets[preset] || presets.default;
  }

  async getUserSettings(userId: string, childId?: string): Promise<any> {
    const query: any = { userId };
    if (childId) query.childId = childId;
    return Accessibility.findOne(query).lean();
  }

  async setUserSettings(userId: string, data: any, childId?: string): Promise<any> {
    const query: any = { userId };
    if (childId) query.childId = childId;
    return Accessibility.findOneAndUpdate(query, { ...data, userId, childId }, { upsert: true, new: true });
  }

  async applyPreset(userId: string, preset: string, childId?: string): Promise<any> {
    const settings = await this.getPreset(preset);
    return this.setUserSettings(userId, { preset, settings }, childId);
  }

  async getSchoolAccessibility(schoolId: string): Promise<any[]> {
    return Accessibility.find({ scope: 'school', scopeId: schoolId }).lean();
  }

  async getFamilyAccessibility(familyId: string): Promise<any[]> {
    return Accessibility.find({ scope: 'family', scopeId: familyId }).lean();
  }

  async applyBulkPreset(userIds: string[], preset: string): Promise<number> {
    const settings = await this.getPreset(preset);
    const result = await Accessibility.updateMany(
      { userId: { $in: userIds } },
      { $set: { preset, settings } },
    );
    return result.modifiedCount;
  }
}
