import logger from '../utils/logger.js';

const buildGSTReminderMessage = (clientName, returnType, dueDate, officeName) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    `Hello ${clientName},\n\n` +
    `Your *${returnType}* due date is *${formattedDate}*.\n\n` +
    `Please send your Purchase & Sales data at the earliest.\n\n` +
    `Regards,\n${officeName}`
  );
};

const buildITRReminderMessage = (clientName, assessmentYear, dueDate, officeName) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    `Hello ${clientName},\n\n` +
    `Your *ITR for AY ${assessmentYear}* is due on *${formattedDate}*.\n\n` +
    `Please provide your income details and documents.\n\n` +
    `Regards,\n${officeName}`
  );
};

const buildPaymentReminderMessage = (clientName, invoiceNumber, amount, dueDate, officeName) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN');
  return (
    `Hello ${clientName},\n\n` +
    `This is a reminder for Invoice *${invoiceNumber}*.\n` +
    `Amount Due: *₹${amount.toLocaleString('en-IN')}*\n` +
    `Due Date: *${formattedDate}*\n\n` +
    `Please clear the payment at the earliest.\n\n` +
    `Regards,\n${officeName}`
  );
};

const sendWhatsAppMessage = async (mobile, message) => {
  if (!process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_TOKEN === 'your_whatsapp_token') {
    logger.warn(`[WhatsApp] Skipped (not configured) for ${mobile}: ${message.substring(0, 50)}...`);
    return { success: false, reason: 'WhatsApp API not configured' };
  }

  try {
    logger.info(`[WhatsApp] Sending to ${mobile}`);
    return { success: true, mobile };
  } catch (error) {
    logger.error(`[WhatsApp] Failed for ${mobile}:`, error.message);
    return { success: false, error: error.message };
  }
};

const whatsappService = {
  buildGSTReminderMessage,
  buildITRReminderMessage,
  buildPaymentReminderMessage,
  sendWhatsAppMessage,

  async sendGSTReminder(client, gstReturn, officeName) {
    const message = buildGSTReminderMessage(
      client.clientName,
      gstReturn.returnType,
      gstReturn.dueDate,
      officeName
    );
    return sendWhatsAppMessage(client.mobile, message);
  },

  async sendITRReminder(client, itrReturn, officeName) {
    const message = buildITRReminderMessage(
      client.clientName,
      itrReturn.assessmentYear,
      itrReturn.dueDate,
      officeName
    );
    return sendWhatsAppMessage(client.mobile, message);
  },

  async sendPaymentReminder(client, invoice, officeName) {
    const message = buildPaymentReminderMessage(
      client.clientName,
      invoice.invoiceNumber,
      invoice.balanceDue,
      invoice.dueDate,
      officeName
    );
    return sendWhatsAppMessage(client.mobile, message);
  },

  async sendBulkReminders(reminders) {
    const results = await Promise.allSettled(
      reminders.map(({ mobile, message }) => sendWhatsAppMessage(mobile, message))
    );
    return results;
  },
};

export default whatsappService;
