import { Wallet } from '../models/wallet.model.js';
import { User } from '../models/user.model.js';
import { RewardService } from './reward.service.js';

/**
 * WalletService is maintained for backward compatibility.
 * All core reward logic now lives in RewardService.
 */
export class WalletService {
  static async getOrCreateWallet(childId: string) {
    return RewardService.getOrCreateWallet(childId);
  }

  static async getWallet(childId: string) {
    return RewardService.getWallet(childId);
  }

  static async getTransactions(userId: string, page = 1, limit = 20, actionType?: string) {
    return RewardService.getHistory(userId, page, limit, actionType);
  }

  static async convertPoints(childId: string, pointsToConvert: number) {
    return RewardService.convertPoints(childId, pointsToConvert);
  }

  static async requestConversion(childId: string, pointsToConvert: number, parentId: string) {
    return RewardService.requestConversion(childId, pointsToConvert, parentId);
  }

  static async approveConversion(conversionId: string, parentId: string) {
    return RewardService.approveConversion(conversionId, parentId);
  }

  static async rejectConversion(conversionId: string, parentId: string, reason?: string) {
    return RewardService.rejectConversion(conversionId, parentId, reason);
  }

  static async getConversions(userId: string, status?: string) {
    return RewardService.getConversions(userId, status);
  }

  static async getPendingConversionsForFamily(familyId: string) {
    return RewardService.getPendingConversionsForFamily(familyId);
  }

  static async giftPoints(senderId: string, receiverId: string, amount: number, message?: string) {
    return RewardService.giftPoints(senderId, receiverId, amount, message);
  }

  static async giftCoins(parentId: string, childId: string, amount: number, message?: string) {
    return RewardService.giftCoins(parentId, childId, amount, message);
  }

  static async freezeWallet(userId: string) {
    return RewardService.setWalletStatus(userId, 'frozen');
  }

  static async unfreezeWallet(userId: string) {
    return RewardService.setWalletStatus(userId, 'active');
  }

  static async adjustBalance(userId: string, adminId: string, pointsDelta: number, coinsDelta: number, reason: string) {
    return RewardService.adjustBalance(userId, adminId, pointsDelta, coinsDelta, reason);
  }

  static async getEconomyStats() {
    return RewardService.getEconomyStats();
  }
}
