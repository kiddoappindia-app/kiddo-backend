import { Schema, model } from 'mongoose';

export type MediaType = 'image' | 'video' | 'animation' | 'lottie' | 'audio' | 'pdf' | 'json';

const mediaAssetSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'animation', 'lottie', 'audio', 'pdf', 'json'], required: true },
    category: { type: String, enum: ['avatar', 'pet', 'furniture', 'store', 'achievement', 'badge', 'certificate', 'theme', 'animation', 'ui', 'other'], required: true },
    url: { type: String, required: true },
    cdnUrl: { type: String },
    thumbnailUrl: { type: String },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dimensions: {
      width: Number,
      height: Number,
    },
    metadata: { type: Schema.Types.Mixed },
    tags: [String],
    version: { type: Number, default: 1 },
    versions: [{
      version: Number,
      url: String,
      cdnUrl: String,
      size: Number,
      uploadedAt: Date,
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    }],
    status: { type: String, enum: ['uploading', 'processing', 'ready', 'error'], default: 'uploading' },
    checksum: { type: String },
    cdn: {
      provider: { type: String, default: 'local' },
      edgeUrls: [String],
      cachedAt: Date,
      expiresAt: Date,
    },
    access: {
      public: { type: Boolean, default: true },
      signed: { type: Boolean, default: false },
      expiresAt: Date,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

mediaAssetSchema.index({ type: 1, category: 1 });
mediaAssetSchema.index({ tags: 1 });
mediaAssetSchema.index({ status: 1 });

export const MediaAsset = model('MediaAsset', mediaAssetSchema);
