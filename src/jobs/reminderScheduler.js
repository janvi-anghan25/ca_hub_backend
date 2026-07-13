import cron from 'node-cron';
import gstReturnRepository from '../repositories/gstReturnRepository.js';
import itrReturnRepository from '../repositories/itrReturnRepository.js';
import whatsappService from '../services/whatsappService.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

const REMINDER_INTERVALS = [7, 3, 1];

const sendGSTReminders = async () => {
  logger.info('[Scheduler] Running GST reminder job');
  for (const days of REMINDER_INTERVALS) {
    const returns = await gstReturnRepository.findForReminder(days);
    for (const gstReturn of returns) {
      const client = gstReturn.client;
      if (!client) continue;

      const alreadySent = gstReturn.remindersSent?.some(
        (r) => r.daysBeforeDue === days && new Date(r.sentAt).toDateString() === new Date().toDateString()
      );
      if (alreadySent) continue;

      try {
        if (client.mobile) {
          await whatsappService.sendGSTReminder(client, gstReturn, 'CA Office');
        }

        await gstReturnRepository.updateById(gstReturn._id, {
          $push: {
            remindersSent: {
              sentAt: new Date(),
              type: 'WhatsApp',
              daysBeforeDue: days,
            },
          },
        });

        logger.info(`GST reminder sent: ${client.clientName} - ${gstReturn.returnType} (${days} days before)`);
      } catch (err) {
        logger.error(`GST reminder failed for ${client.clientName}:`, err.message);
      }
    }
  }
};

const sendITRReminders = async () => {
  logger.info('[Scheduler] Running ITR reminder job');
  for (const days of REMINDER_INTERVALS) {
    const returns = await itrReturnRepository.findForReminder(days);
    for (const itrReturn of returns) {
      const client = itrReturn.client;
      if (!client) continue;

      try {
        if (client.mobile) {
          await whatsappService.sendITRReminder(client, itrReturn, 'CA Office');
        }
        logger.info(`ITR reminder sent: ${client.clientName} - AY${itrReturn.assessmentYear}`);
      } catch (err) {
        logger.error(`ITR reminder failed for ${client.clientName}:`, err.message);
      }
    }
  }
};

export const initScheduler = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await sendGSTReminders();
      await sendITRReminders();
    } catch (err) {
      logger.error('[Scheduler] Daily reminder job failed:', err.message);
    }
  });

  logger.info('[Scheduler] Reminder scheduler initialized');
};
