import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'DUE_DATE',
        'PAYMENT_RECEIVED',
        'DOCUMENT_UPLOADED',
        'TASK_ASSIGNED',
        'TASK_COMPLETED',
        'GST_FILED',
        'ITR_FILED',
        'INVOICE_CREATED',
        'REMINDER',
        'SYSTEM',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
