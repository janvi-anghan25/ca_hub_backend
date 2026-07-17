import gstReturnRepository from '../repositories/gstReturnRepository.js';
import clientService from './clientService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { parseSpreadsheet, pick, toNumber, parseDate } from '../utils/spreadsheet.js';

const GST_RETURN_TYPES = ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'CMP-08', 'GSTR-2A', 'GSTR-2B', 'Other'];
const GST_STATUSES = ['Pending', 'Data Received', 'In Progress', 'Filed', 'Late Filed'];
const MAX_IMPORT_ROWS = 1000;

const amount = (value) => {
  const n = toNumber(value);
  return Number.isFinite(n) ? n : 0;
};

const gstReturnService = {
  async createReturn(data, userId, officeId) {
    const existing = await gstReturnRepository.findOne({
      client: data.client,
      returnType: data.returnType,
      'period.year': data.period.year,
      'period.month': data.period.month,
      'period.quarter': data.period.quarter,
    });
    if (existing) throw new AppError('GST Return for this period already exists', 409, 'RETURN_EXISTS');

    const gstReturn = await gstReturnRepository.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`GST Return created for client ${data.client}`);
    return gstReturn;
  },

  async getReturns(officeId, filters, page, limit) {
    const filter = { office: officeId, ...filters };
    return gstReturnRepository.find(filter, {
      page,
      limit,
      sort: { dueDate: 1 },
      populate: { path: 'client', select: 'clientName firmName gstNumber mobile' },
    });
  },

  async getReturnById(id) {
    const gstReturn = await gstReturnRepository.findById(id, {
      populate: [
        { path: 'client', select: 'clientName firmName gstNumber mobile email' },
        { path: 'assignedTo', select: 'name mobile' },
      ],
    });
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
    return gstReturn;
  },

  async updateReturn(id, data) {
    if (data.status === 'Filed' && !data.filedDate) {
      data.filedDate = new Date();
    }
    const gstReturn = await gstReturnRepository.updateById(id, data);
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
    return gstReturn;
  },

  async deleteReturn(id) {
    const gstReturn = await gstReturnRepository.deleteById(id);
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
  },

  async getPendingReturns(officeId, days) {
    return gstReturnRepository.getPendingReturns(officeId, days);
  },

  async getOverdueReturns(officeId) {
    return gstReturnRepository.getOverdueReturns(officeId);
  },

  async getMonthlyStats(officeId, year) {
    return gstReturnRepository.getMonthlyStats(officeId, year);
  },

  /**
   * Bulk-import GST returns from a parsed spreadsheet buffer. Auto-creates a
   * client per row when one cannot be matched, and collects per-row errors
   * instead of failing the whole batch.
   */
  async importReturns(buffer, userId, officeId) {
    const rows = parseSpreadsheet(buffer);
    if (!rows.length) throw new AppError('The file has no data rows', 400, 'EMPTY_FILE');
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new AppError(`Too many rows (max ${MAX_IMPORT_ROWS} per import)`, 400, 'TOO_MANY_ROWS');
    }

    const summary = { totalRows: rows.length, imported: 0, clientsCreated: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i += 1) {
      const rowNum = i + 2; // account for the header row
      const row = rows[i];
      try {
        const returnType = pick(row, 'returnType', 'return type', 'type');
        if (!GST_RETURN_TYPES.includes(returnType)) {
          throw new AppError(`returnType must be one of: ${GST_RETURN_TYPES.join(', ')}`, 400);
        }

        const year = toNumber(pick(row, 'year', 'period year'));
        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
          throw new AppError('year is missing or invalid (e.g. 2025)', 400);
        }

        const monthRaw = pick(row, 'month', 'period month');
        const month = monthRaw ? toNumber(monthRaw) : undefined;
        if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
          throw new AppError('month must be between 1 and 12, or left blank', 400);
        }

        const quarterRaw = pick(row, 'quarter');
        const quarter = quarterRaw ? toNumber(quarterRaw) : undefined;
        if (quarter !== undefined && (!Number.isInteger(quarter) || quarter < 1 || quarter > 4)) {
          throw new AppError('quarter must be between 1 and 4, or left blank', 400);
        }

        const dueDate = parseDate(pick(row, 'dueDate', 'due date'));
        if (!dueDate) throw new AppError('dueDate is missing or invalid (use YYYY-MM-DD)', 400);

        const status = pick(row, 'status');
        if (status && !GST_STATUSES.includes(status)) {
          throw new AppError(`status must be one of: ${GST_STATUSES.join(', ')}`, 400);
        }

        const { client, created } = await clientService.findOrCreateForImport({
          clientName: pick(row, 'clientName', 'client name', 'client'),
          mobile: pick(row, 'mobile', 'phone'),
          gstNumber: pick(row, 'gstNumber', 'gst', 'gst number'),
          businessType: pick(row, 'businessType', 'business type'),
          category: ['GST'],
        }, userId, officeId);
        if (created) summary.clientsCreated += 1;

        await this.createReturn({
          client: client._id,
          returnType,
          period: { year, month, quarter },
          dueDate,
          status: status || undefined,
          filedDate: parseDate(pick(row, 'filedDate', 'filed date')) || undefined,
          taxableAmount: amount(pick(row, 'taxableAmount', 'taxable amount')),
          taxAmount: amount(pick(row, 'taxAmount', 'tax amount')),
          lateFee: amount(pick(row, 'lateFee', 'late fee')),
          interest: amount(pick(row, 'interest')),
          acknowledgementNumber: pick(row, 'acknowledgementNumber', 'acknowledgement number') || undefined,
          notes: pick(row, 'notes') || undefined,
        }, userId, officeId);
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: rowNum, message: err.message || 'Failed to import row' });
      }
    }

    logger.info(`GST import by user ${userId}: ${summary.imported}/${summary.totalRows} imported`);
    return summary;
  },

  async markLateFiled(id) {
    const gstReturn = await gstReturnRepository.findById(id, { lean: false });
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');

    if (new Date(gstReturn.dueDate) < new Date() && gstReturn.status !== 'Filed') {
      await gstReturnRepository.updateById(id, { status: 'Late Filed', filedDate: new Date() });
    }
  },
};

export default gstReturnService;
