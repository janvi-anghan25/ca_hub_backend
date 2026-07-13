import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const employeeService = {
  async createEmployee(data, userId, officeId) {
    const employee = await Employee.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`Employee created: ${employee.name}`);
    return employee;
  },

  async getEmployees(officeId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Employee.find({ office: officeId, isActive: true })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments({ office: officeId, isActive: true }),
    ]);
    return { data, total };
  },

  async getEmployeeById(id) {
    const employee = await Employee.findById(id)
      .populate('user', 'name email')
      .populate('assignedClients', 'clientName firmName status')
      .lean();
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  },

  async updateEmployee(id, data) {
    const employee = await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  },

  async assignClient(employeeId, clientId) {
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $addToSet: { assignedClients: clientId } },
      { new: true }
    );
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  },

  async markAttendance(employeeId, attendanceData) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingIdx = employee.attendance.findIndex(
      (a) => new Date(a.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (existingIdx >= 0) {
      employee.attendance[existingIdx] = { ...employee.attendance[existingIdx].toObject(), ...attendanceData };
    } else {
      employee.attendance.push({ date: today, ...attendanceData });
    }

    await employee.save();
    return employee;
  },

  async applyLeave(employeeId, leaveData) {
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $push: { leaves: leaveData } },
      { new: true }
    );
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  },

  async deleteEmployee(id) {
    const employee = await Employee.findByIdAndUpdate(id, { isActive: false });
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  },
};

export default employeeService;
