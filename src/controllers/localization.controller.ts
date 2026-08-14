import { Request, Response } from 'express';
import { LocalizationService } from '../services/localization.service.js';

const service = new LocalizationService();

export class LocalizationController {
  async getLocales(req: Request, res: Response) {
    const { status } = req.query;
    const locales = await service.getLocales(status as string);
    res.json({ success: true, data: locales });
  }

  async getLocaleById(req: Request, res: Response) {
    const locale = await service.getLocaleById(req.params.id as string);
    res.json({ success: true, data: locale });
  }

  async getLocaleByCode(req: Request, res: Response) {
    const locale = await service.getLocaleByCode(req.params.locale as string);
    res.json({ success: true, data: locale });
  }

  async createLocale(req: Request, res: Response) {
    const userId = (req as any).userId;
    const locale = await service.createLocale(req.body, userId);
    res.json({ success: true, data: locale });
  }

  async updateLocale(req: Request, res: Response) {
    const userId = (req as any).userId;
    const locale = await service.updateLocale(req.params.id as string, req.body, userId);
    res.json({ success: true, data: locale });
  }

  async publishLocale(req: Request, res: Response) {
    const locale = await service.publishLocale(req.params.id as string);
    res.json({ success: true, data: locale });
  }

  async deleteLocale(req: Request, res: Response) {
    await service.deleteLocale(req.params.id as string);
    res.json({ success: true });
  }

  async getTranslations(req: Request, res: Response) {
    const locale = req.params.locale as string;
    const { keys } = req.query;
    const keyList = keys ? (keys as string).split(',') : undefined;
    const translations = await service.getTranslations(locale, keyList);
    res.json({ success: true, data: translations });
  }

  async updateTranslation(req: Request, res: Response) {
    const userId = (req as any).userId;
    const locale = req.params.locale as string;
    const { key, value } = req.body;
    await service.updateTranslation(locale, key, value, userId);
    res.json({ success: true });
  }

  async bulkUpdateTranslations(req: Request, res: Response) {
    const userId = (req as any).userId;
    const locale = req.params.locale as string;
    const { translations } = req.body;
    await service.bulkUpdateTranslations(locale, translations, userId);
    res.json({ success: true });
  }

  async getCompletionStats(req: Request, res: Response) {
    const stats = await service.getCompletionStats(req.params.locale as string);
    res.json({ success: true, data: stats });
  }
}
