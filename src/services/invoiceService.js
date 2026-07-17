import invoiceRepository from '../repositories/invoiceRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const calculateInvoiceTotals = (lineItems, discountType, discountValue, gstRate, isIGST = false) => {
  const subTotal = lineItems.reduce((sum, item) => {
    item.amount = item.quantity * item.rate;
    return sum + item.amount;
  }, 0);

  const discountAmount =
    discountType === 'Percentage' ? (subTotal * discountValue) / 100 : discountValue;

  const taxableAmount = subTotal - discountAmount;
  const totalTax = (taxableAmount * gstRate) / 100;
  const cgst = isIGST ? 0 : totalTax / 2;
  const sgst = isIGST ? 0 : totalTax / 2;
  const igst = isIGST ? totalTax : 0;
  const totalAmount = taxableAmount + totalTax;

  return { subTotal, discountAmount, totalTax, cgst, sgst, igst, totalAmount };
};

const invoiceService = {
  async createInvoice(data, userId, officeId) {
    const invoiceNumber = await invoiceRepository.getNextInvoiceNumber(officeId);
    const totals = calculateInvoiceTotals(
      data.lineItems,
      data.discountType,
      data.discountValue || 0,
      data.gstRate || 18,
      data.isIGST
    );

    const invoice = await invoiceRepository.create({
      ...data,
      ...totals,
      invoiceNumber,
      balanceDue: totals.totalAmount,
      createdBy: userId,
      office: officeId,
    });
    logger.info(`Invoice created: ${invoiceNumber}`);
    return invoice;
  },

  async getInvoices(officeId, filters, page, limit) {
    const filter = { office: officeId, ...filters };
    return invoiceRepository.find(filter, {
      page,
      limit,
      sort: { invoiceDate: -1 },
      populate: { path: 'client', select: 'clientName firmName mobile email' },
    });
  },

  async getInvoiceById(id) {
    const invoice = await invoiceRepository.findById(id, {
      populate: { path: 'client', select: 'clientName firmName mobile email gstNumber panNumber address' },
    });
    if (!invoice) throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    return invoice;
  },

  async updateInvoice(id, data) {
    if (data.lineItems) {
      const totals = calculateInvoiceTotals(
        data.lineItems,
        data.discountType,
        data.discountValue || 0,
        data.gstRate || 18,
        data.isIGST
      );
      Object.assign(data, totals);
    }
    const invoice = await invoiceRepository.updateById(id, data);
    if (!invoice) throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    return invoice;
  },

  async recordPayment(invoiceId, paymentData, userId, officeId) {
    const invoice = await invoiceRepository.findById(invoiceId, { lean: false });
    if (!invoice) throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');

    if (paymentData.amount > invoice.balanceDue) {
      throw new AppError('Payment amount exceeds balance due', 400, 'EXCESS_PAYMENT');
    }

    const receiptNumber = await paymentRepository.getNextReceiptNumber(officeId);

    const payment = await paymentRepository.create({
      ...paymentData,
      receiptNumber,
      client: invoice.client,
      invoice: invoiceId,
      createdBy: userId,
      office: officeId,
    });

    invoice.paidAmount += paymentData.amount;
    await invoice.save();

    return payment;
  },

  async getPayments(officeId, filters, page, limit) {
    return paymentRepository.getPaymentsByOffice(officeId, filters, page, limit);
  },

  async getRevenueStats(officeId, startDate, endDate) {
    return invoiceRepository.getRevenueStats(officeId, startDate, endDate);
  },

  async getMonthlyRevenue(officeId, year) {
    return invoiceRepository.getMonthlyRevenue(officeId, year);
  },

  async getOverdueInvoices(officeId) {
    return invoiceRepository.getOverdueInvoices(officeId);
  },
};

export default invoiceService;
