import { Schema, model } from 'mongoose';

const localizationSchema = new Schema(
  {
    locale: { type: String, required: true, index: true },
    language: { type: String, required: true },
    region: { type: String },
    isRTL: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'review', 'published'], default: 'draft' },
    completion: { type: Number, default: 0, min: 0, max: 100 },
    keys: { type: Map, of: String, required: true },
    categories: [{ type: String }],
    metadata: {
      totalKeys: { type: Number, default: 0 },
      translatedKeys: { type: Number, default: 0 },
      lastTranslator: String,
      lastTranslatedAt: Date,
    },
    assets: {
      images: [{ key: String, url: String }],
      audio: [{ key: String, url: String }],
      voice: [{ key: String, url: String }],
    },
    dateFormat: { type: String, default: 'yyyy-MM-dd' },
    timeFormat: { type: String, default: 'HH:mm' },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    numberFormat: { type: String, default: '#,##0.00' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

localizationSchema.index({ locale: 1, status: 1 });

export const Localization = model('Localization', localizationSchema);
