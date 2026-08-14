import { Schema, model } from 'mongoose';

const accessibilitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    preset: { type: String, enum: ['default', 'reduced_motion', 'large_fonts', 'high_contrast', 'simple_mode', 'voice_guidance', 'custom'], default: 'default' },
    settings: {
      reducedMotion: { type: Boolean, default: false },
      largeFonts: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false },
      simpleMode: { type: Boolean, default: false },
      voiceGuidance: { type: Boolean, default: false },
      screenReader: { type: Boolean, default: false },
      fontSize: { type: Number, default: 16 },
      contrastLevel: { type: String, enum: ['normal', 'medium', 'high'], default: 'normal' },
      animationSpeed: { type: Number, default: 1 },
      colorBlindMode: { type: String, enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia'], default: 'none' },
      hapticFeedback: { type: Boolean, default: true },
      autoPlayAudio: { type: Boolean, default: false },
      subtitleSize: { type: Number, default: 16 },
    },
    scope: { type: String, enum: ['global', 'school', 'family', 'user'], default: 'user' },
    scopeId: { type: Schema.Types.ObjectId },
    appliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

accessibilitySchema.index({ childId: 1 });
accessibilitySchema.index({ scope: 1, scopeId: 1 });

export const Accessibility = model('Accessibility', accessibilitySchema);
