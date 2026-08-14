import { Request, Response } from 'express';
import { WalletEngine } from '../services/wallet-engine.service.js';

export class WalletController {
  static async getBalance(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const wallet = await WalletEngine.getBalance(childId);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTransactionHistory(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const { currency, type, limit, offset, startDate, endDate } = req.query;
      const transactions = await WalletEngine.getTransactionHistory(childId, {
        currency: currency as string,
        type: type as string,
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTransactionSummary(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const { startDate, endDate } = req.query;
      const summary = await WalletEngine.getTransactionSummary(
        childId,
        new Date(startDate as string),
        new Date(endDate as string),
      );
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async credit(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const result = await WalletEngine.credit(childId, (req as any).user.familyId, {
        ...req.body,
        type: req.body.type || 'adjustment',
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async debit(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const result = await WalletEngine.debit(childId, (req as any).user.familyId, {
        ...req.body,
        type: req.body.type || 'purchase',
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async adjust(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const result = await WalletEngine.adjustBalance(childId, (req as any).user.familyId, {
        currency: req.body.currency,
        amount: req.body.amount,
        reason: req.body.reason,
        performedBy: (req as any).user.id,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
