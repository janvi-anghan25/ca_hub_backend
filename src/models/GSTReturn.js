import mongoose from 'mongoose';

const gstReturnSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    returnType: {
      type: String,
      enum: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'CMP-08', 'GSTR-2A', 'GSTR-2B', 'Other'],
      required: true,
    },
    period: {
      month: { type: Number, min: 1, max: 12 },
      quarter: { type: Number, min: 1, max: 4 },
      year: { type: Number, required: true },
    },
    dueDate: { type: Date, required: true },
    filedDate: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'Data Received', 'In Progress', 'Filed', 'Late Filed'],
      default: 'Pending',
    },
    acknowledgementNumber: { type: String, trim: true },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    interest: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    remindersSent: [
      {
        sentAt: Date,
        type: { type: String, enum: ['Email', 'WhatsApp', 'SMS'] },
        daysBeforeDue: Number,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  { timestamps: true }
);

gstReturnSchema.index({ client: 1, returnType: 1, 'period.year': 1, 'period.month': 1 });
gstReturnSchema.index({ status: 1, dueDate: 1 });
gstReturnSchema.index({ dueDate: 1 });
gstReturnSchema.index({ assignedTo: 1 });

const GSTReturn = mongoose.model('GST_Return', gstReturnSchema);
export default GSTReturn;
