import { ContentVersion } from '../models/content-version.model.js';

export class ContentVersionService {
  async getVersions(contentId: string): Promise<any[]> {
    return ContentVersion.find({ contentId }).sort({ version: -1 }).lean();
  }

  async getVersion(contentId: string, version: number): Promise<any> {
    return ContentVersion.findOne({ contentId, version }).lean();
  }

  async createVersion(data: any, userId: string): Promise<any> {
    const latest = await ContentVersion.findOne({ contentId: data.contentId }).sort({ version: -1 });
    const nextVersion = latest ? latest.version + 1 : 1;
    return ContentVersion.create({ ...data, version: nextVersion, createdBy: userId });
  }

  async reviewVersion(contentId: string, version: number, approved: boolean, reviewerId: string, notes?: string): Promise<any> {
    const status = approved ? 'approved' : 'review';
    return ContentVersion.findOneAndUpdate(
      { contentId, version },
      { status, reviewedBy: reviewerId, reviewedAt: new Date(), changeNotes: notes },
      { new: true },
    );
  }

  async publishVersion(contentId: string, version: number): Promise<any> {
    return ContentVersion.findOneAndUpdate(
      { contentId, version },
      { status: 'published', publishedAt: new Date() },
      { new: true },
    );
  }

  async getDraftVersions(): Promise<any[]> {
    return ContentVersion.find({ status: 'draft' }).sort({ createdAt: -1 }).lean();
  }

  async getReviewVersions(): Promise<any[]> {
    return ContentVersion.find({ status: 'review' }).sort({ createdAt: -1 }).lean();
  }

  async revertToVersion(contentId: string, version: number, userId: string): Promise<any> {
    const targetVersion = await ContentVersion.findOne({ contentId, version });
    if (!targetVersion) throw new Error('Version not found');
    const latest = await ContentVersion.findOne({ contentId }).sort({ version: -1 });
    const nextVersion = latest ? latest.version + 1 : 1;
    return ContentVersion.create({
      contentId,
      contentType: targetVersion.contentType,
      version: nextVersion,
      data: targetVersion.data,
      status: 'draft',
      changeNotes: `Reverted to v${version}`,
      createdBy: userId,
    });
  }

  async deleteVersion(contentId: string, version: number): Promise<void> {
    await ContentVersion.findOneAndDelete({ contentId, version });
  }

  async getVersionStats(contentId: string): Promise<any> {
    const versions = await ContentVersion.find({ contentId }).lean();
    return {
      total: versions.length,
      drafts: versions.filter(v => v.status === 'draft').length,
      inReview: versions.filter(v => v.status === 'review').length,
      published: versions.filter(v => v.status === 'published').length,
      latest: versions[0]?.version || 0,
    };
  }
}
