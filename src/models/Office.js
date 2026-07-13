import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    mobile: String,
    email: String,
    gstNumber: { type: String, uppercase: true, trim: true },
    panNumber: { type: String, uppercase: true, trim: true },
    logo: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    invoicePrefix: { type: String, default: 'INV' },
    invoiceCounter: { type: Number, default: 1 },
    financialYearStart: { type: Number, default: 4, min: 1, max: 12 },
  },
  { timestamps: true }
);

const Office = mongoose.model('Office', officeSchema);
export default Office;
