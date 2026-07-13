import mongoose from 'mongoose';

const itrReturnSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    formType: {
      type: String,
      enum: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7'],
      required: true,
    },
    assessmentYear: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Format should be YYYY-YY e.g. 2024-25'],
    },
    financialYear: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Format should be YYYY-YY e.g. 2023-24'],
    },
    dueDate: { type: Date, required: true },
    filedDate: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'Data Received', 'In Progress', 'Filed', 'Late Filed', 'Revised'],
      default: 'Pending',
    },
    acknowledgementNumber: { type: String, trim: true },
    grossIncome: { type: Number, default: 0 },
    taxableIncome: { type: Number, default: 0 },
    taxPaid: { type: Number, default: 0 },
    taxLiability: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['Not Applicable', 'Pending', 'Processed', 'Received'],
      default: 'Not Applicable',
    },
    lateFee: { type: Number, default: 0 },
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

itrReturnSchema.index({ client: 1, assessmentYear: 1, formType: 1 });
itrReturnSchema.index({ status: 1, dueDate: 1 });
itrReturnSchema.index({ dueDate: 1 });
itrReturnSchema.index({ assignedTo: 1 });

const ITRReturn = mongoose.model('ITR_Return', itrReturnSchema);
export default ITRReturn;
