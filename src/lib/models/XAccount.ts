import mongoose, { Schema, Document, models } from 'mongoose';

export interface IXAccount extends Document {
  userId: string;
  username: string;
  name: string;
  profileImageUrl: string;
  accessToken: string;
  accessSecret: string;
  isActive: boolean;
  createdAt: Date;
}

const XAccountSchema = new Schema<IXAccount>({
  userId:          { type: String, required: true, unique: true },
  username:        { type: String, required: true },
  name:            { type: String, required: true },
  profileImageUrl: { type: String, default: '' },
  accessToken:     { type: String, required: true },
  accessSecret:    { type: String, required: true },
  isActive:        { type: Boolean, default: false },
  createdAt:       { type: Date, default: Date.now },
});

export const XAccount = models.XAccount || mongoose.model<IXAccount>('XAccount', XAccountSchema);
