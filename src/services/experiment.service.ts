import { Experiment } from '../models/experiment.model.js';

export class ExperimentService {
  async getExperiments(status?: string, category?: string): Promise<any[]> {
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    return Experiment.find(query).sort({ createdAt: -1 }).lean();
  }

  async getExperimentById(id: string): Promise<any> {
    return Experiment.findById(id).lean();
  }

  async createExperiment(data: any, userId: string): Promise<any> {
    return Experiment.create({ ...data, createdBy: userId });
  }

  async updateExperiment(id: string, data: any): Promise<any> {
    return Experiment.findByIdAndUpdate(id, data, { new: true });
  }

  async startExperiment(id: string): Promise<any> {
    return Experiment.findByIdAndUpdate(id, {
      status: 'running',
      startDate: new Date(),
    }, { new: true });
  }

  async pauseExperiment(id: string): Promise<any> {
    return Experiment.findByIdAndUpdate(id, { status: 'paused' }, { new: true });
  }

  async completeExperiment(id: string): Promise<any> {
    return Experiment.findByIdAndUpdate(id, {
      status: 'completed',
      endDate: new Date(),
    }, { new: true });
  }

  async deleteExperiment(id: string): Promise<void> {
    await Experiment.findByIdAndDelete(id);
  }

  async assignVariant(experimentId: string, userId: string): Promise<string> {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment || experiment.status !== 'running') return 'control';
    const { variants, targeting } = experiment as any;
    const hash = this.simpleHash(userId + experimentId);
    if (targeting.percentage < 100) {
      if ((hash % 100) >= targeting.percentage) return 'control';
    }
    let cumulative = 0;
    const totalWeight = variants.reduce((sum: number, v: any) => sum + v.weight, 0);
    for (const variant of variants) {
      cumulative += variant.weight / totalWeight * 100;
      if ((hash % 100) < cumulative) return variant.name;
    }
    return variants[0]?.name || 'control';
  }

  async trackConversion(experimentId: string, variant: string, metric: string): Promise<void> {
    await Experiment.findByIdAndUpdate(experimentId, {
      $inc: {
        'results.conversions': 1,
        [`results.variantResults.$[elem].conversions`]: 1,
      },
    }, {
      arrayFilters: [{ 'elem.variant': variant }],
    });
  }

  async trackParticipation(experimentId: string, variant: string): Promise<void> {
    await Experiment.findByIdAndUpdate(experimentId, {
      $inc: {
        'results.participants': 1,
        [`results.variantResults.$[elem].participants`]: 1,
      },
    }, {
      arrayFilters: [{ 'elem.variant': variant }],
    });
  }

  async getResults(id: string): Promise<any> {
    const experiment = await Experiment.findById(id).lean();
    if (!experiment) return null;
    const { results } = experiment as any;
    const summary = {
      totalParticipants: results.participants,
      totalConversions: results.conversions,
      conversionRate: results.participants > 0 ? (results.conversions / results.participants * 100).toFixed(2) : 0,
      variants: results.variantResults.map((v: any) => ({
        ...v,
        conversionRate: v.participants > 0 ? (v.conversions / v.participants * 100).toFixed(2) : 0,
      })),
    };
    return summary;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
