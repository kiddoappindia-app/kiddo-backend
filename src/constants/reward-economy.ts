import { TRANSACTION_ACTION_TYPES } from '../models/reward-transaction.model.js';

export const WALLET_STATUSES = ['active', 'frozen', 'suspended'] as const;
export type WalletStatus = (typeof WALLET_STATUSES)[number];

export const TRANSACTION_SOURCES = ['system', 'parent', 'teacher', 'admin', 'child'] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const CONVERSION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];

export const FREQUENCY_TYPES = ['once_per_day', 'once_per_week', 'once_per_month', 'unlimited'] as const;
export type FrequencyType = (typeof FREQUENCY_TYPES)[number];

export type TransactionActionType = (typeof TRANSACTION_ACTION_TYPES)[number];

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const XP_FORMULA_FACTOR = 100;

export const DEFAULT_CONVERSION_RATIO = 1000;
export const DEFAULT_MIN_CONVERSION_POINTS = 1000;

export const DEFAULT_XP_NEEDED_MULTIPLIER = 100;
