import { Pet, PetType, IPet } from '../models/pet.model.js';
import { Logger } from '../utils/logger.js';

export class PetEngineService {
  static async getPetTypes(filters?: { category?: string; rarity?: string; isAvailable?: boolean }) {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.rarity) query.rarity = filters.rarity;
    if (filters?.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
    else query.isAvailable = true;
    return PetType.find(query).sort({ sortOrder: 1 });
  }

  static async getChildPets(childId: string) {
    return Pet.find({ childId }).sort({ createdAt: -1 });
  }

  static async createPet(childId: string, familyId: string, petTypeId: string, name: string) {
    const petType = await PetType.findOne({ id: petTypeId, isAvailable: true });
    if (!petType) throw new Error('Pet type not found or unavailable');

    const existingCount = await Pet.countDocuments({ childId });
    if (existingCount >= 5) throw new Error('Maximum 5 pets per child');

    const existing = await Pet.findOne({ childId, petTypeId });
    if (existing) throw new Error('You already have this pet');

    const pet = new Pet({
      childId,
      familyId,
      petTypeId,
      name,
      hunger: petType.baseStats.hunger,
      happiness: petType.baseStats.happiness,
      energy: petType.baseStats.energy,
      health: petType.baseStats.health,
      cleanliness: petType.baseStats.cleanliness,
    });

    await pet.save();
    Logger.info(`Pet created: ${name} (${petTypeId}) for child ${childId}`);
    return pet;
  }

  static async feedPet(petId: string, childId: string) {
    const pet = await Pet.findOne({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');

    const now = new Date();
    const timeSinceLastFed = pet.lastFedAt ? now.getTime() - pet.lastFedAt.getTime() : Infinity;
    if (timeSinceLastFed < 30 * 60 * 1000) throw new Error('Pet was fed recently. Wait 30 minutes.');

    pet.hunger = Math.min(100, pet.hunger + 20);
    pet.happiness = Math.min(100, pet.happiness + 5);
    pet.xp += 5;
    pet.totalInteractions += 1;
    pet.lastFedAt = now;

    await this.checkLevelUp(pet);
    await pet.save();
    return pet;
  }

  static async playWithPet(petId: string, childId: string) {
    const pet = await Pet.findOne({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');

    if (pet.energy < 10) throw new Error('Pet is too tired to play');

    const now = new Date();
    pet.happiness = Math.min(100, pet.happiness + 25);
    pet.energy = Math.max(0, pet.energy - 10);
    pet.hunger = Math.max(0, pet.hunger - 5);
    pet.xp += 10;
    pet.totalInteractions += 1;
    pet.lastPlayedAt = now;

    await this.checkLevelUp(pet);
    await pet.save();
    return pet;
  }

  static async sleepPet(petId: string, childId: string) {
    const pet = await Pet.findOne({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');

    const now = new Date();
    pet.energy = Math.min(100, pet.energy + 30);
    pet.health = Math.min(100, pet.health + 5);
    pet.xp += 3;
    pet.totalInteractions += 1;
    pet.lastSleptAt = now;

    await this.checkLevelUp(pet);
    await pet.save();
    return pet;
  }

  static async cleanPet(petId: string, childId: string) {
    const pet = await Pet.findOne({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');

    const now = new Date();
    pet.cleanliness = Math.min(100, pet.cleanliness + 30);
    pet.happiness = Math.min(100, pet.happiness + 5);
    pet.xp += 3;
    pet.totalInteractions += 1;
    pet.lastCleanedAt = now;

    await this.checkLevelUp(pet);
    await pet.save();
    return pet;
  }

  static async renamePet(petId: string, childId: string, newName: string) {
    const pet = await Pet.findOne({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');
    if (newName.length > 20) throw new Error('Name too long');
    pet.name = newName;
    await pet.save();
    return pet;
  }

  static async releasePet(petId: string, childId: string) {
    const pet = await Pet.findOneAndDelete({ _id: petId, childId });
    if (!pet) throw new Error('Pet not found');
    Logger.info(`Pet released: ${pet.name} (${pet.petTypeId}) by child ${childId}`);
    return { success: true };
  }

  static async petInteractionFromTask(childId: string, familyId: string, taskCategory: string, difficulty: string) {
    const pets = await Pet.find({ childId });
    if (pets.length === 0) return;

    const xpMap: Record<string, number> = { easy: 3, medium: 5, hard: 8, expert: 12 };
    const xp = xpMap[difficulty] || 5;

    for (const pet of pets) {
      pet.xp += xp;
      pet.happiness = Math.min(100, pet.happiness + 3);
      pet.totalInteractions += 1;

      if (taskCategory === 'exercise' || taskCategory === 'Morning') {
        pet.energy = Math.min(100, pet.energy + 2);
      }
      if (taskCategory === 'After School' || taskCategory === 'Night') {
        pet.hunger = Math.max(0, pet.hunger - 2);
      }

      await this.checkLevelUp(pet);
      await pet.save();
    }
  }

  static async updatePetStats() {
    const decayRate = { hunger: -2, happiness: -1, energy: 1, cleanliness: -1, health: 0 };
    await Pet.updateMany({}, {
      $inc: {
        hunger: decayRate.hunger,
        happiness: decayRate.happiness,
        cleanliness: decayRate.cleanliness,
      },
      $min: { hunger: 0, happiness: 0, cleanliness: 0 },
      $max: { energy: 100, health: 100 },
    });
  }

  private static async checkLevelUp(pet: IPet) {
    while (pet.xp >= pet.xpToNextLevel && pet.level < 100) {
      pet.xp -= pet.xpToNextLevel;
      pet.level += 1;
      pet.xpToNextLevel = Math.floor(pet.xpToNextLevel * 1.3);

      const petType = await PetType.findOne({ id: pet.petTypeId });
      if (petType) {
        const nextStage = petType.evolutionStages.find(s => s.requiredLevel === pet.level);
        if (nextStage && nextStage.stage > pet.evolutionStage) {
          pet.evolutionStage = nextStage.stage;
          pet.skills = [...new Set([...pet.skills, ...nextStage.unlockedSkills])];
          Logger.info(`Pet ${pet.name} evolved to stage ${nextStage.stage}: ${nextStage.name}`);
        }
      }
    }
  }

  static async getPetStats(childId: string) {
    const pets = await Pet.find({ childId });
    return {
      totalPets: pets.length,
      totalLevels: pets.reduce((sum, p) => sum + p.level, 0),
      totalInteractions: pets.reduce((sum, p) => sum + p.totalInteractions, 0),
      highestLevel: pets.length > 0 ? Math.max(...pets.map(p => p.level)) : 0,
      averageHappiness: pets.length > 0 ? Math.round(pets.reduce((sum, p) => sum + p.happiness, 0) / pets.length) : 0,
    };
  }
}
