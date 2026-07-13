import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Half-Day', 'Leave'], default: 'Present' },
  checkIn: Date,
  checkOut: Date,
  notes: String,
});

const leaveSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Other'], required: true },
  reason: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    joiningDate: { type: Date },
    salary: { type: Number },
    isActive: { type: Boolean, default: true },
    assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
    attendance: [attendanceSchema],
    leaves: [leaveSchema],
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

employeeSchema.index({ isActive: 1 });
employeeSchema.index({ office: 1 });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
