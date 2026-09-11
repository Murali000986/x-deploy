import mongoose from 'mongoose';

const globalWithMongoose = global as typeof globalThis & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB() {
  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URL || '';
  if (!uri) throw new Error('MONGODB_URL / MONGO_URL env var is not set');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).catch(err => {
      // Clear on failure so next call retries instead of reusing rejected promise
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
