import mongoose, { Schema, models, model } from 'mongoose';

export interface ICandidate {
  id: string;
  username: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: Record<string, number>;
  status: 'new' | 'pending' | 'chat';
  addedAt: string;
  lastActivity: string;
}

const CandidateSchema = new Schema<ICandidate>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  profile_image_url: String,
  public_metrics: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['new', 'pending', 'chat'], default: 'new' },
  addedAt: { type: String, default: () => new Date().toISOString() },
  lastActivity: { type: String, default: () => new Date().toISOString() },
});

// Prevent model re-compilation in hot-reload / serverless
const Candidate = models.Candidate || model<ICandidate>('Candidate', CandidateSchema);
export default Candidate;
