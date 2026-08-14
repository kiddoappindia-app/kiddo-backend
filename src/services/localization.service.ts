import { Localization } from '../models/localization.model.js';

export class LocalizationService {
  async getLocales(status?: string): Promise<any[]> {
    const query: any = {};
    if (status) query.status = status;
    return Localization.find(query).sort({ locale: 1 }).lean();
  }

  async getLocaleById(id: string): Promise<any> {
    return Localization.findById(id).lean();
  }

  async getLocaleByCode(locale: string): Promise<any> {
    return Localization.findOne({ locale, status: 'published' }).lean();
  }

  async createLocale(data: any, userId: string): Promise<any> {
    return Localization.create({ ...data, updatedBy: userId });
  }

  async updateLocale(id: string, data: any, userId: string): Promise<any> {
    return Localization.findByIdAndUpdate(id, { ...data, updatedBy: userId }, { new: true });
  }

  async publishLocale(id: string): Promise<any> {
    return Localization.findByIdAndUpdate(id, { status: 'published' }, { new: true });
  }

  async deleteLocale(id: string): Promise<void> {
    await Localization.findByIdAndDelete(id);
  }

  async getTranslation(locale: string, key: string): Promise<string | null> {
    const doc = await Localization.findOne({ locale, status: 'published' }).lean();
    if (!doc) return null;
    return (doc.keys as any)?.[key] || null;
  }

  async getTranslations(locale: string, keys?: string[]): Promise<Record<string, string>> {
    const doc = await Localization.findOne({ locale, status: 'published' }).lean();
    if (!doc) return {};
    const allKeys = (doc.keys || {}) as Record<string, string>;
    if (!keys) return allKeys;
    const result: Record<string, string> = {};
    for (const key of keys) {
      if (allKeys[key]) result[key] = allKeys[key];
    }
    return result;
  }

  async updateTranslation(locale: string, key: string, value: string, userId: string): Promise<void> {
    const doc = await Localization.findOne({ locale });
    if (!doc) throw new Error('Locale not found');
    (doc.keys as any).set(key, value);
    doc.markModified('keys');
    if (doc.metadata) doc.metadata.lastTranslatedAt = new Date();
    doc.updatedBy = userId as any;
    await doc.save();
  }

  async bulkUpdateTranslations(locale: string, translations: Record<string, string>, userId: string): Promise<void> {
    const doc = await Localization.findOne({ locale });
    if (!doc) throw new Error('Locale not found');
    for (const [key, value] of Object.entries(translations)) {
      (doc.keys as any).set(key, value);
    }
    doc.markModified('keys');
    if (doc.metadata) {
      doc.metadata.lastTranslatedAt = new Date();
      doc.metadata.translatedKeys = Object.keys(translations).length;
    }
    doc.updatedBy = userId as any;
    await doc.save();
  }

  async getCompletionStats(locale: string): Promise<any> {
    const doc = await Localization.findOne({ locale }).lean();
    if (!doc) return null;
    return {
      locale: doc.locale,
      totalKeys: (doc as any).metadata?.totalKeys,
      translatedKeys: (doc as any).metadata?.translatedKeys,
      completion: doc.completion,
      lastTranslatedAt: (doc as any).metadata?.lastTranslatedAt,
    };
  }
}
