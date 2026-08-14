import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as pairingService from '../services/pairing.service.js';

export const generateCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await pairingService.generatePairingCode(
    req.user!.familyId!,
    req.user!.id,
  );
  res.status(StatusCodes.OK).json(result);
});

export const generateQr = asyncHandler(async (req: Request, res: Response) => {
  const result = await pairingService.generatePairingQr(
    req.user!.familyId!,
    req.user!.id,
  );
  res.status(StatusCodes.OK).json(result);
});

export const validateCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await pairingService.validatePairingCode(
    req.body.code,
    req.user!.id,
  );
  res.status(StatusCodes.OK).json(result);
});

export const validateQr = asyncHandler(async (req: Request, res: Response) => {
  const result = await pairingService.validatePairingQr(
    req.body.qrData,
    req.user!.id,
  );
  res.status(StatusCodes.OK).json(result);
});

export const revokeAll = asyncHandler(async (req: Request, res: Response) => {
  await pairingService.revokePairingTokens(req.user!.familyId!);
  res.status(StatusCodes.OK).json({ success: true });
});

export const getActiveTokens = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await pairingService.getActivePairingTokens(req.user!.familyId!);
  res.status(StatusCodes.OK).json({ tokens });
});
