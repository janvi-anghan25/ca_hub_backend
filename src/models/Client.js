import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid mobile number'],
    },
    alternativeMobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number'],
    },
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number'],
    },
    aadhaarNumber: { type: String, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    businessType: {
      type: String,
      enum: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'HUF', 'Other'],
      required: true,
    },
    state: { type: String, trim: true },
    category: {
      type: [String],
      enum: ['GST', 'ITR', 'Company', 'LLP', 'Partnership', 'Audit', 'Other'],
      default: [],
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    photo: { type: String },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.index({ clientName: 'text', firmName: 'text', gstNumber: 'text', panNumber: 'text' });
clientSchema.index({ status: 1, category: 1 });
clientSchema.index({ assignedEmployee: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ mobile: 1 });

const Client = mongoose.model('Client', clientSchema);
export default Client;
