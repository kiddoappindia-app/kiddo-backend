import { Schema, model, Types } from 'mongoose';

export interface IWakeUpCompletion {
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  date: Date;
  completedAt: Date;
  rewardPoints: number;
  rewardBracket: 'before_430' | 'before_530' | 'before_630' | 'after_630';
  targetTime: string;
}

const wakeUpCompletionSchema = new Schema<IWakeUpCompletion>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    date: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    rewardPoints: { type: Number, required: true, min: 0, max: 30 },
    rewardBracket: {
      type: String,
      enum: ['before_430', 'before_530', 'before_630', 'after_630'],
      required: true,
    },
    targetTime: { type: String, required: true },
  },
  { timestamps: true },
);

wakeUpCompletionSchema.index({ childId: 1, date: 1 }, { unique: true });

export const WakeUpCompletion = model<IWakeUpCompletion>('WakeUpCompletion', wakeUpCompletionSchema);
