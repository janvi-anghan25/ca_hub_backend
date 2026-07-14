import User from '../models/User.js';
import Office from '../models/Office.js';
import Client from '../models/Client.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const superAdminService = {
  // ─── Offices ─────────────────────────────────────────────────────────────────
  async getAllOffices({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [data, total] = await Promise.all([
      Office.find(query)
        .populate('owner', 'name email mobile isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Office.countDocuments(query),
    ]);
    return { data, total };
  },

  async getOfficeById(id) {
    const office = await Office.findById(id)
      .populate('owner', 'name email mobile isActive role')
      .lean();
    if (!office) throw new AppError('Office not found', 404, 'OFFICE_NOT_FOUND');

    const [clientCount, employeeCount] = await Promise.all([
      Client.countDocuments({ office: id }),
      Employee.countDocuments({ office: id, isActive: true }),
    ]);

    return { ...office, stats: { clientCount, employeeCount } };
  },

  async updateOffice(id, data) {
    const office = await Office.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!office) throw new AppError('Office not found', 404, 'OFFICE_NOT_FOUND');
    logger.info(`Super admin updated office: ${id}`);
    return office;
  },

  async toggleOfficeStatus(id) {
    const office = await Office.findById(id);
    if (!office) throw new AppError('Office not found', 404, 'OFFICE_NOT_FOUND');

    office.isActive = !office.isActive;
    await office.save();

    // Also toggle the admin user's active status
    await User.findByIdAndUpdate(office.owner, { isActive: office.isActive });

    logger.info(`Super admin toggled office ${id} status to: ${office.isActive}`);
    return office;
  },

  // ─── Admins ───────────────────────────────────────────────────────────────────
  async getAllAdmins({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;
    const query = {
      role: 'admin',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      User.find(query)
        .populate('office', 'name isActive')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);
    return { data, total };
  },

  async createAdmin({ name, email, password, mobile, officeName, officeAddress }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

    // Create office first
    const office = new Office({
      name: officeName,
      address: officeAddress,
      owner: null, // will be set after user creation
      isActive: true,
    });

    const admin = new User({ name, email, password, mobile, role: 'admin' });
    admin.office = office._id;
    office.owner = admin._id;

    await Promise.all([admin.save(), office.save()]);
    logger.info(`Super admin created new admin: ${email} with office: ${officeName}`);

    return { user: admin.toPublicJSON(), office };
  },

  async toggleAdminStatus(adminId) {
    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');

    admin.isActive = !admin.isActive;
    await admin.save({ validateBeforeSave: false });

    if (admin.office) {
      await Office.findByIdAndUpdate(admin.office, { isActive: admin.isActive });
    }

    logger.info(`Super admin toggled admin ${adminId} status to: ${admin.isActive}`);
    return admin.toPublicJSON();
  },

  // ─── Global Stats ─────────────────────────────────────────────────────────────
  async getGlobalStats() {
    const [totalOffices, activeOffices, totalAdmins, activeAdmins, totalClients, totalEmployees] =
      await Promise.all([
        Office.countDocuments(),
        Office.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'admin', isActive: true }),
        Client.countDocuments(),
        Employee.countDocuments({ isActive: true }),
      ]);

    return {
      offices: { total: totalOffices, active: activeOffices, inactive: totalOffices - activeOffices },
      admins: { total: totalAdmins, active: activeAdmins, inactive: totalAdmins - activeAdmins },
      clients: { total: totalClients },
      employees: { total: totalEmployees },
    };
  },
};

export default superAdminService;
