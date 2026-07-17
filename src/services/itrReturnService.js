import itrReturnRepository from '../repositories/itrReturnRepository.js';
import clientService from './clientService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { parseSpreadsheet, pick, toNumber, parseDate } from '../utils/spreadsheet.js';

const ITR_FORM_TYPES = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7'];
const ITR_STATUSES = ['Pending', 'Data Received', 'In Progress', 'Filed', 'Late Filed', 'Revised'];
const ITR_REFUND_STATUSES = ['Not Applicable', 'Pending', 'Processed', 'Received'];
const YEAR_FORMAT = /^\d{4}-\d{2}$/;
const MAX_IMPORT_ROWS = 1000;

const amount = (value) => {
  const n = toNumber(value);
  return Number.isFinite(n) ? n : 0;
};

const itrReturnService = {
  async createReturn(data, userId, officeId) {
    const existing = await itrReturnRepository.findOne({
      client: data.client,
      formType: data.formType,
      assessmentYear: data.assessmentYear,
    });
    if (existing) throw new AppError('ITR for this assessment year already exists', 409, 'ITR_EXISTS');

    const itrReturn = await itrReturnRepository.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`ITR created for client ${data.client}`);
    return itrReturn;
  },

  async getReturns(officeId, filters, page, limit) {
    const filter = { office: officeId, ...filters };
    return itrReturnRepository.find(filter, {
      page,
      limit,
      sort: { dueDate: 1 },
      populate: { path: 'client', select: 'clientName firmName panNumber mobile' },
    });
  },

  async getReturnById(id) {
    const itrReturn = await itrReturnRepository.findById(id, {
      populate: [
        { path: 'client', select: 'clientName firmName panNumber mobile email' },
        { path: 'assignedTo', select: 'name mobile' },
      ],
    });
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
    return itrReturn;
  },

  async updateReturn(id, data) {
    if (data.status === 'Filed' && !data.filedDate) {
      data.filedDate = new Date();
    }
    const itrReturn = await itrReturnRepository.updateById(id, data);
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
    return itrReturn;
  },

  async deleteReturn(id) {
    const itrReturn = await itrReturnRepository.deleteById(id);
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
  },

  async getPendingReturns(officeId, days) {
    return itrReturnRepository.getPendingReturns(officeId, days);
  },

  async getOverdueReturns(officeId) {
    return itrReturnRepository.getOverdueReturns(officeId);
  },

  async getRefundPending(officeId) {
    return itrReturnRepository.getRefundPending(officeId);
  },

  /**
   * Bulk-import ITR records from a parsed spreadsheet buffer. Auto-creates a
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
        const formType = pick(row, 'formType', 'form type', 'type');
        if (!ITR_FORM_TYPES.includes(formType)) {
          throw new AppError(`formType must be one of: ${ITR_FORM_TYPES.join(', ')}`, 400);
        }

        const assessmentYear = pick(row, 'assessmentYear', 'assessment year', 'ay');
        if (!YEAR_FORMAT.test(assessmentYear)) {
          throw new AppError('assessmentYear must be in YYYY-YY format (e.g. 2025-26)', 400);
        }

        const financialYear = pick(row, 'financialYear', 'financial year', 'fy');
        if (!YEAR_FORMAT.test(financialYear)) {
          throw new AppError('financialYear must be in YYYY-YY format (e.g. 2024-25)', 400);
        }

        const dueDate = parseDate(pick(row, 'dueDate', 'due date'));
        if (!dueDate) throw new AppError('dueDate is missing or invalid (use YYYY-MM-DD)', 400);

        const status = pick(row, 'status');
        if (status && !ITR_STATUSES.includes(status)) {
          throw new AppError(`status must be one of: ${ITR_STATUSES.join(', ')}`, 400);
        }

        const refundStatus = pick(row, 'refundStatus', 'refund status');
        if (refundStatus && !ITR_REFUND_STATUSES.includes(refundStatus)) {
          throw new AppError(`refundStatus must be one of: ${ITR_REFUND_STATUSES.join(', ')}`, 400);
        }

        const { client, created } = await clientService.findOrCreateForImport({
          clientName: pick(row, 'clientName', 'client name', 'client'),
          mobile: pick(row, 'mobile', 'phone'),
          panNumber: pick(row, 'panNumber', 'pan', 'pan number'),
          businessType: pick(row, 'businessType', 'business type'),
          category: ['ITR'],
        }, userId, officeId);
        if (created) summary.clientsCreated += 1;

        await this.createReturn({
          client: client._id,
          formType,
          assessmentYear,
          financialYear,
          dueDate,
          status: status || undefined,
          refundStatus: refundStatus || undefined,
          filedDate: parseDate(pick(row, 'filedDate', 'filed date')) || undefined,
          grossIncome: amount(pick(row, 'grossIncome', 'gross income')),
          taxableIncome: amount(pick(row, 'taxableIncome', 'taxable income')),
          taxPaid: amount(pick(row, 'taxPaid', 'tax paid')),
          taxLiability: amount(pick(row, 'taxLiability', 'tax liability')),
          refundAmount: amount(pick(row, 'refundAmount', 'refund amount')),
          lateFee: amount(pick(row, 'lateFee', 'late fee')),
          acknowledgementNumber: pick(row, 'acknowledgementNumber', 'acknowledgement number') || undefined,
          notes: pick(row, 'notes') || undefined,
        }, userId, officeId);
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: rowNum, message: err.message || 'Failed to import row' });
      }
    }

    logger.info(`ITR import by user ${userId}: ${summary.imported}/${summary.totalRows} imported`);
    return summary;
  },
};

export default itrReturnService;
