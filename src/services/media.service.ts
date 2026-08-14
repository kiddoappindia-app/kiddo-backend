import { MediaAsset } from '../models/media-asset.model.js';
import { randomBytes } from 'crypto';

export class MediaService {
  async getAssets(type?: string, category?: string, page = 1, limit = 50): Promise<any> {
    const query: any = {};
    if (type) query.type = type;
    if (category) query.category = category;
    const [assets, total] = await Promise.all([
      MediaAsset.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MediaAsset.countDocuments(query),
    ]);
    return { assets, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAssetById(id: string): Promise<any> {
    return MediaAsset.findById(id).lean();
  }

  async createAsset(data: any, userId: string): Promise<any> {
    return MediaAsset.create({ ...data, uploadedBy: userId, status: 'ready' });
  }

  async updateAsset(id: string, data: any): Promise<any> {
    return MediaAsset.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAsset(id: string): Promise<void> {
    await MediaAsset.findByIdAndDelete(id);
  }

  async getSignedUrl(filename: string, expiresIn = 3600): Promise<{ url: string; checksum: string }> {
    const checksum = randomBytes(16).toString('hex');
    const url = `/uploads/${checksum}/${filename}`;
    return { url, checksum };
  }

  async getAssetsByTags(tags: string[]): Promise<any[]> {
    return MediaAsset.find({ tags: { $in: tags }, status: 'ready' }).lean();
  }

  async getAssetsByCategory(category: string): Promise<any[]> {
    return MediaAsset.find({ category, status: 'ready' }).sort({ name: 1 }).lean();
  }

  async createVersion(id: string, data: any, userId: string): Promise<any> {
    const asset = await MediaAsset.findById(id);
    if (!asset) throw new Error('Asset not found');
    const newVersion = asset.version + 1;
    (asset as any).versions.push({
      version: newVersion,
      url: data.url,
      cdnUrl: data.cdnUrl,
      size: data.size,
      uploadedAt: new Date(),
      uploadedBy: userId,
    });
    asset.version = newVersion;
    asset.url = data.url;
    asset.size = data.size;
    return asset.save();
  }

  async getAssetVersions(id: string): Promise<any[]> {
    const asset = await MediaAsset.findById(id).lean();
    return (asset as any)?.versions || [];
  }

  async searchAssets(query: string): Promise<any[]> {
    return MediaAsset.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
      status: 'ready',
    }).limit(50).lean();
  }

  async getPublicAssets(category?: string): Promise<any[]> {
    const query: any = { 'access.public': true, status: 'ready' };
    if (category) query.category = category;
    return MediaAsset.find(query).sort({ createdAt: -1 }).lean();
  }
}
