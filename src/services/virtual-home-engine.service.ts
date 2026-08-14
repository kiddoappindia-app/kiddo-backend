import { VirtualHome, FurnitureItem, IVirtualHome, IRoom } from '../models/virtual-home.model.js';
import { Logger } from '../utils/logger.js';

const DEFAULT_ROOMS: Omit<IRoom, 'isUnlocked'>[] = [
  { roomId: 'bedroom', type: 'bedroom', name: 'Bedroom', furniture: [], decorations: [] },
  { roomId: 'study', type: 'study', name: 'Study Area', furniture: [], decorations: [] },
];

export class VirtualHomeEngineService {
  static async getHome(childId: string) {
    let home = await VirtualHome.findOne({ childId });
    if (!home) {
      home = await this.createHome(childId, 'familyId');
    }
    return home;
  }

  static async createHome(childId: string, familyId: string) {
    const existing = await VirtualHome.findOne({ childId });
    if (existing) return existing;

    const home = new VirtualHome({
      childId,
      familyId,
      name: 'My Home',
      rooms: DEFAULT_ROOMS.map(r => ({ ...r, isUnlocked: true, unlockedAt: new Date() })),
    });
    await home.save();
    Logger.info(`Virtual home created for child ${childId}`);
    return home;
  }

  static async getFurnitureItems(filters?: { category?: string; roomType?: string; rarity?: string }) {
    const query: any = { isAvailable: true };
    if (filters?.category) query.category = filters.category;
    if (filters?.roomType) query.roomType = { $in: [filters.roomType] };
    if (filters?.rarity) query.rarity = filters.rarity;
    return FurnitureItem.find(query).sort({ sortOrder: 1 });
  }

  static async placeFurniture(childId: string, roomId: string, furnitureId: string, position: { x: number; y: number }) {
    const home = await VirtualHome.findOne({ childId });
    if (!home) throw new Error('Home not found');

    const room = home.rooms.find(r => r.roomId === roomId);
    if (!room) throw new Error('Room not found');
    if (!room.isUnlocked) throw new Error('Room is locked');

    const furniture = await FurnitureItem.findOne({ id: furnitureId, isAvailable: true });
    if (!furniture) throw new Error('Furniture not found');

    const existingFurniture = room.furniture.find(f => f.furnitureId === furnitureId);
    if (existingFurniture) {
      existingFurniture.position = position;
    } else {
      room.furniture.push({
        furnitureId,
        name: furniture.name,
        category: furniture.category,
        position,
        rotation: 0,
        scale: 1,
        placedAt: new Date(),
      });
    }

    home.totalDecorations = home.rooms.reduce((sum, r) => sum + r.furniture.length + r.decorations.length, 0);
    await home.save();
    return home;
  }

  static async removeFurniture(childId: string, roomId: string, furnitureId: string) {
    const home = await VirtualHome.findOne({ childId });
    if (!home) throw new Error('Home not found');

    const room = home.rooms.find(r => r.roomId === roomId);
    if (!room) throw new Error('Room not found');

    room.furniture = room.furniture.filter(f => f.furnitureId !== furnitureId);
    home.totalDecorations = home.rooms.reduce((sum, r) => sum + r.furniture.length + r.decorations.length, 0);
    await home.save();
    return home;
  }

  static async unlockRoom(childId: string, roomType: string) {
    const home = await VirtualHome.findOne({ childId });
    if (!home) throw new Error('Home not found');

    const existingRoom = home.rooms.find(r => r.type === roomType);
    if (existingRoom) {
      if (existingRoom.isUnlocked) throw new Error('Room already unlocked');
      existingRoom.isUnlocked = true;
      existingRoom.unlockedAt = new Date();
    } else {
      const roomNames: Record<string, string> = {
        garden: 'Garden',
        pet_area: 'Pet Area',
        achievement_wall: 'Achievement Wall',
        bookshelf: 'Bookshelf',
        toy_shelf: 'Toy Shelf',
        playroom: 'Playroom',
      };
      home.rooms.push({
        roomId: roomType,
        type: roomType,
        name: roomNames[roomType] || roomType,
        furniture: [],
        decorations: [],
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    await home.save();
    Logger.info(`Room ${roomType} unlocked for child ${childId}`);
    return home;
  }

  static async renameHome(childId: string, name: string) {
    const home = await VirtualHome.findOne({ childId });
    if (!home) throw new Error('Home not found');
    home.name = name;
    await home.save();
    return home;
  }

  static async getHomeStats(childId: string) {
    const home = await VirtualHome.findOne({ childId });
    if (!home) return { totalRooms: 0, unlockedRooms: 0, totalFurniture: 0, totalDecorations: 0 };
    return {
      totalRooms: home.rooms.length,
      unlockedRooms: home.rooms.filter(r => r.isUnlocked).length,
      totalFurniture: home.rooms.reduce((sum, r) => sum + r.furniture.length, 0),
      totalDecorations: home.totalDecorations,
    };
  }
}
