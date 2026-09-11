import mongoose, { Schema, models, model } from 'mongoose';

export interface IXList {
  username: string;
  xUrl: string;
  walletAddress?: string;
  usdValue?: string;
  category?: string;
  status: 'new' | 'pending' | 'chat' | 'done';
  addedAt: string;
}

const XListSchema = new Schema<IXList>({
  username: { type: String, required: true, unique: true },
  xUrl: { type: String, required: true },
  walletAddress: String,
  usdValue: String,
  category: String,
  status: { type: String, enum: ['new', 'pending', 'chat', 'done'], default: 'new' },
  addedAt: { type: String, default: () => new Date().toISOString() },
});

const XList = models.XList || model<IXList>('XList', XListSchema);
export default XList;
