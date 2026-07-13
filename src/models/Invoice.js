import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  sacCode: { type: String, trim: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    lineItems: [lineItemSchema],
    subTotal: { type: Number, required: true, default: 0 },
    discountType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Pending',
    },
    notes: { type: String, trim: true },
    terms: { type: String, trim: true },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
    },
    nextRecurringDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  { timestamps: true }
);

invoiceSchema.index({ client: 1, invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ dueDate: 1 });

invoiceSchema.pre('save', function (next) {
  this.balanceDue = this.totalAmount - this.paidAmount;
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partially Paid';
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
