import { ModerationReport } from '../models/moderation-report.model.js';

export class ModerationService {
  async getReports(status?: string, type?: string, severity?: string): Promise<any[]> {
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    return ModerationReport.find(query).sort({ createdAt: -1 }).lean();
  }

  async getReportById(id: string): Promise<any> {
    return ModerationReport.findById(id).lean();
  }

  async createReport(data: any, reporterId: string): Promise<any> {
    return ModerationReport.create({ ...data, reporterId });
  }

  async reviewReport(id: string, reviewerId: string, action: string, resolution?: string): Promise<any> {
    return ModerationReport.findByIdAndUpdate(id, {
      status: 'reviewing',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      action,
      resolution,
      $push: {
        audit: {
          action: `reviewed: ${action}`,
          performedBy: reviewerId,
          performedAt: new Date(),
          details: { resolution },
        },
      },
    }, { new: true });
  }

  async resolveReport(id: string, resolution: string, reviewerId: string): Promise<any> {
    return ModerationReport.findByIdAndUpdate(id, {
      status: 'resolved',
      resolution,
      reviewedBy: reviewerId,
      $push: {
        audit: {
          action: 'resolved',
          performedBy: reviewerId,
          performedAt: new Date(),
          details: { resolution },
        },
      },
    }, { new: true });
  }

  async escalateReport(id: string, escalatedTo: string, reason: string, level: number): Promise<any> {
    return ModerationReport.findByIdAndUpdate(id, {
      status: 'escalated',
      escalation: { escalatedTo, escalatedAt: new Date(), reason, level },
      $push: {
        audit: {
          action: `escalated to level ${level}`,
          performedBy: escalatedTo,
          performedAt: new Date(),
          details: { reason, level },
        },
      },
    }, { new: true });
  }

  async dismissReport(id: string, reviewerId: string, reason: string): Promise<any> {
    return ModerationReport.findByIdAndUpdate(id, {
      status: 'dismissed',
      resolution: reason,
      reviewedBy: reviewerId,
      $push: {
        audit: {
          action: 'dismissed',
          performedBy: reviewerId,
          performedAt: new Date(),
          details: { reason },
        },
      },
    }, { new: true });
  }

  async getReportsByTarget(targetType: string, targetId: string): Promise<any[]> {
    return ModerationReport.find({ targetType, targetId }).sort({ createdAt: -1 }).lean();
  }

  async getReportsByUser(userId: string): Promise<any[]> {
    return ModerationReport.find({ reporterId: userId }).sort({ createdAt: -1 }).lean();
  }

  async getStats(): Promise<any> {
    const [pending, reviewing, resolved, escalated, dismissed] = await Promise.all([
      ModerationReport.countDocuments({ status: 'pending' }),
      ModerationReport.countDocuments({ status: 'reviewing' }),
      ModerationReport.countDocuments({ status: 'resolved' }),
      ModerationReport.countDocuments({ status: 'escalated' }),
      ModerationReport.countDocuments({ status: 'dismissed' }),
    ]);
    return { pending, reviewing, resolved, escalated, dismissed, total: pending + reviewing + resolved + escalated + dismissed };
  }

  async getAuditTrail(id: string): Promise<any[]> {
    const report = await ModerationReport.findById(id).lean();
    return (report as any)?.audit || [];
  }

  async getFlaggedContent(): Promise<any[]> {
    return ModerationReport.find({
      status: { $in: ['pending', 'reviewing'] },
      severity: { $in: ['high', 'critical'] },
    }).sort({ severity: -1, createdAt: -1 }).lean();
  }
}
