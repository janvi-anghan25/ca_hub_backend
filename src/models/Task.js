import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['GST', 'ITR', 'Audit', 'ROC', 'TDS', 'General', 'Other'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Review', 'Done', 'Cancelled'],
      default: 'Todo',
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number },
    tags: [{ type: String, trim: true }],
    attachments: [{ type: String }],
    subtasks: [
      {
        title: { type: String, required: true, trim: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ client: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);
export default Task;
