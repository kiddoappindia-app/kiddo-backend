import { Request, Response } from 'express';
import { PetEngineService } from '../services/pet-engine.service.js';
import { Logger } from '../utils/logger.js';

export class PetEngineController {
  static async getPetTypes(req: Request, res: Response) {
    try {
      const { category, rarity } = req.query;
      const petTypes = await PetEngineService.getPetTypes({
        category: category as string,
        rarity: rarity as string,
      });
      res.json(petTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMyPets(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const pets = await PetEngineService.getChildPets(userId);
      res.json(pets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createPet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const familyId = (req as any).familyId || 'unknown';
      const { petTypeId, name } = req.body;
      const pet = await PetEngineService.createPet(userId, familyId, petTypeId, name);
      res.status(201).json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async feedPet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const pet = await PetEngineService.feedPet(petId, userId);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async playWithPet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const pet = await PetEngineService.playWithPet(petId, userId);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async sleepPet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const pet = await PetEngineService.sleepPet(petId, userId);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async cleanPet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const pet = await PetEngineService.cleanPet(petId, userId);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async renamePet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const { name } = req.body;
      const pet = await PetEngineService.renamePet(petId, userId, name);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async releasePet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const petId = req.params.petId as string;
      const result = await PetEngineService.releasePet(petId, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getPetStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await PetEngineService.getPetStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
