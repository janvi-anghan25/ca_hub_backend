import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'Other'],
      required: true,
    },
    transactionId: { type: String, trim: true },
    bankName: { type: String, trim: true },
    chequeNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    receiptNumber: { type: String, unique: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  { timestamps: true }
);

paymentSchema.index({ client: 1, paymentDate: -1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
