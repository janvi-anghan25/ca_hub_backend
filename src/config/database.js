import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Payment from '../models/Payment.js';

/**
 * One-time cleanup of a legacy global unique index on payments.receiptNumber.
 * It caused E11000 collisions on null receipt numbers. Receipt uniqueness is now
 * enforced per-office via a partial compound index. Safe + idempotent.
 */
const dropStalePaymentIndex = async () => {
  try {
    const indexes = await Payment.collection.indexes();
    if (indexes.some((idx) => idx.name === 'receiptNumber_1')) {
      await Payment.collection.dropIndex('receiptNumber_1');
      logger.info('Dropped stale global payments.receiptNumber_1 index');
    }
  } catch (err) {
    // Collection/index may not exist yet on a fresh database — safe to ignore.
    logger.warn(`Payment index cleanup skipped: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    await dropStalePaymentIndex();

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
