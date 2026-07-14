import crypto from 'crypto';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import emailService from '../utils/emailService.js';

const generateTemporaryPassword = () => {
  const segment = crypto.randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 8);
  return `Emp${segment}1a`;
};

const employeeService = {
  /**
   * Admin creates a CA-office employee with login credentials.
   * Creates linked User (role=employee) + Employee record and emails temp password.
   */
  async createEmployee(data, adminUser) {
    const officeId = adminUser.office;
    if (!officeId) {
      throw new AppError('Admin is not associated with an office', 400, 'NO_OFFICE');
    }

    const email = data.email?.toLowerCase()?.trim();
    if (!email) {
      throw new AppError('Email is required to create employee login credentials', 400, 'EMAIL_REQUIRED');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const temporaryPassword = generateTemporaryPassword();

    const user = new User({
      name: data.name,
      email,
      password: temporaryPassword,
      mobile: data.mobile,
      role: 'employee',
      office: officeId,
      mustChangePassword: true,
      isActive: true,
    });

    const employee = new Employee({
      user: user._id,
      name: data.name,
      mobile: data.mobile,
      email,
      designation: data.designation,
      department: data.department,
      joiningDate: data.joiningDate,
      salary: data.salary,
      office: officeId,
      createdBy: adminUser.id || adminUser._id,
      isActive: true,
    });

    await Promise.all([user.save(), employee.save()]);

    const rollback = async () => {
      await Promise.all([
        User.findByIdAndDelete(user._id),
        Employee.findByIdAndDelete(employee._id),
      ]);
    };

    try {
      const emailResult = await emailService.sendEmployeeInviteEmail(
        user,
        temporaryPassword,
        data.designation
      );

      if (emailResult?.skipped) {
        if (process.env.NODE_ENV === 'production') {
          await rollback();
          throw new AppError(
            'Could not send invite email. Check SMTP configuration and try again.',
            502,
            'EMAIL_SEND_FAILED'
          );
        }
        logger.warn(`[DEV] SMTP skipped — employee login for ${email}: ${temporaryPassword}`);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      await rollback();
      logger.error(`Employee invite email failed for ${email}:`, err.message);
      throw new AppError(
        'Could not send invite email. Check SMTP configuration and try again.',
        502,
        'EMAIL_SEND_FAILED'
      );
    }

    logger.info(`Admin created employee account: ${email} (office ${officeId})`);

    const populated = await Employee.findById(employee._id)
      .populate('user', 'name email role mustChangePassword isActive')
      .lean();

    return {
      employee: populated,
      loginId: email,
      // Only returned in non-production when SMTP was skipped — for local testing
      ...(process.env.NODE_ENV !== 'production'
        ? { temporaryPassword }
        : {}),
    };
  },

  async getEmployees(officeId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Employee.find({ office: officeId, isActive: true })
        .populate('user', 'name email role isActive mustChangePassword lastLogin')
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
      .populate('user', 'name email role isActive mustChangePassword lastLogin')
      .populate('assignedClients', 'clientName firmName status')
      .lean();
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  },

  async updateEmployee(id, data) {
    const allowed = {
      name: data.name,
      mobile: data.mobile,
      designation: data.designation,
      department: data.department,
      joiningDate: data.joiningDate,
      salary: data.salary,
    };
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);

    const employee = await Employee.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    // Keep linked login user in sync for name/mobile
    if (employee.user && (allowed.name || allowed.mobile)) {
      const userUpdate = {};
      if (allowed.name) userUpdate.name = allowed.name;
      if (allowed.mobile) userUpdate.mobile = allowed.mobile;
      await User.findByIdAndUpdate(employee.user, userUpdate);
    }

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
      employee.attendance[existingIdx] = {
        ...employee.attendance[existingIdx].toObject(),
        ...attendanceData,
      };
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
    const employee = await Employee.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, { isActive: false });
    }
  },
};

export default employeeService;
