import { ContentItem } from '../models/content-item.model.js';
import { ContentVersion } from '../models/content-version.model.js';

export class ContentService {
  async getContent(type: string, status?: string, page = 1, limit = 50): Promise<any> {
    const query: any = { type };
    if (status) query.status = status;
    const [items, total] = await Promise.all([
      ContentItem.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContentItem.countDocuments(query),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getContentById(id: string): Promise<any> {
    return ContentItem.findById(id).lean();
  }

  async createContent(data: any, userId: string): Promise<any> {
    const item = await ContentItem.create({ ...data, createdBy: userId });
    await ContentVersion.create({
      contentId: item._id,
      contentType: data.type,
      version: 1,
      data: data.data,
      status: 'draft',
      createdBy: userId,
    });
    return item;
  }

  async updateContent(id: string, data: any, userId: string): Promise<any> {
    const item = await ContentItem.findById(id);
    if (!item) throw new Error('Content not found');
    const newVersion = item.version + 1;
    Object.assign(item, data, { $inc: { version: 1 } });
    await item.save();
    await ContentVersion.create({
      contentId: id,
      contentType: item.type,
      version: newVersion,
      data: data.data || item.data,
      changeNotes: data.changeNotes,
      status: 'draft',
      createdBy: userId,
    });
    return item;
  }

  async publishContent(id: string, userId: string): Promise<any> {
    const item = await ContentItem.findById(id);
    if (!item) throw new Error('Content not found');
    item.status = 'published';
    item.publishedAt = new Date();
    item.publishedBy = userId as any;
    await item.save();
    await ContentVersion.findOneAndUpdate(
      { contentId: id, version: item.version },
      { status: 'published', publishedAt: new Date() },
    );
    return item;
  }

  async archiveContent(id: string): Promise<any> {
    return ContentItem.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
  }

  async deleteContent(id: string): Promise<void> {
    await ContentItem.findByIdAndDelete(id);
    await ContentVersion.deleteMany({ contentId: id });
  }

  async getContentVersions(contentId: string): Promise<any[]> {
    return ContentVersion.find({ contentId }).sort({ version: -1 }).lean();
  }

  async revertToVersion(contentId: string, version: number, userId: string): Promise<any> {
    const versionDoc = await ContentVersion.findOne({ contentId, version });
    if (!versionDoc) throw new Error('Version not found');
    return this.updateContent(contentId, { data: versionDoc.data, changeNotes: `Reverted to v${version}` }, userId);
  }

  async searchContent(query: string, type?: string): Promise<any[]> {
    const searchQuery: any = { $text: { $search: query } };
    if (type) searchQuery.type = type;
    return ContentItem.find(searchQuery).limit(50).lean();
  }
}
