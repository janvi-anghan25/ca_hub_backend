import mongoose from 'mongoose';

const documentVersionSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
});

const documentSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    category: {
      type: String,
      enum: ['PAN', 'GST', 'Aadhaar', 'Bank', 'Rent Agreement', 'Balance Sheet', 'ITR', 'Invoice', 'Other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    versions: [documentVersionSchema],
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  { timestamps: true }
);

documentSchema.index({ client: 1, category: 1 });
documentSchema.index({ '$**': 'text' });

const Document = mongoose.model('Document', documentSchema);
export default Document;
