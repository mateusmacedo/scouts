import { Router, Request, Response } from 'express';
import { createLogger } from '../config/logger.config';
import { NotificationService, EmailNotification, SMSNotification } from '../services/notification.service';

const router = Router();
const logger = createLogger();
const notificationService = new NotificationService(logger);

/**
 * POST /api/v1/notifications/email
 * Enviar notificação por email
 */
router.post('/email', async (req: Request, res: Response): Promise<void> => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  try {
    const { to, subject, body, template, variables }: EmailNotification = req.body;
    
    // Validação básica
    if (!to || !subject || !body) {
      requestLogger.warn('Invalid email notification request', {
        to,
        subject: !!subject,
        body: !!body
      });
      
      res.status(400).json({
        error: 'validation_error',
        message: 'to, subject, and body are required',
        correlationId
      });
      return;
    }

    requestLogger.info('Processing email notification request', {
      to,
      subject,
      hasTemplate: !!template,
      hasVariables: !!variables
    });

    const result = await notificationService.sendEmail({
      to,
      subject,
      body,
      template,
      variables
    });

    requestLogger.info('Email notification processed', {
      id: result.id,
      status: result.status,
      to: result.recipient
    });

    res.status(201).json(result);

  } catch (error) {
    requestLogger.error('Email notification processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: req.body.to
    });

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to process email notification',
      correlationId
    });
  }
});

/**
 * POST /api/v1/notifications/sms
 * Enviar notificação por SMS
 */
router.post('/sms', async (req: Request, res: Response): Promise<void> => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  try {
    const { to, message, template, variables }: SMSNotification = req.body;
    
    // Validação básica
    if (!to || !message) {
      requestLogger.warn('Invalid SMS notification request', {
        to,
        hasMessage: !!message
      });
      
      res.status(400).json({
        error: 'validation_error',
        message: 'to and message are required',
        correlationId
      });
      return;
    }

    requestLogger.info('Processing SMS notification request', {
      to,
      hasTemplate: !!template,
      hasVariables: !!variables
    });

    const result = await notificationService.sendSMS({
      to,
      message,
      template,
      variables
    });

    requestLogger.info('SMS notification processed', {
      id: result.id,
      status: result.status,
      to: result.recipient
    });

    res.status(201).json(result);

  } catch (error) {
    requestLogger.error('SMS notification processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: req.body.to
    });

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to process SMS notification',
      correlationId
    });
  }
});

/**
 * GET /api/v1/notifications/:id/status
 * Obter status de uma notificação
 */
router.get('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  try {
    const { id } = req.params;
    
    requestLogger.info('Getting notification status', { id });
    
    const status = notificationService.getStatus(id);
    
    if (!status) {
      requestLogger.warn('Notification not found', { id });
      res.status(404).json({
        error: 'not_found',
        message: 'Notification not found',
        correlationId
      });
      return;
    }

    requestLogger.info('Notification status retrieved', {
      id,
      status: status.status,
      type: status.type
    });

    res.json(status);

  } catch (error) {
    requestLogger.error('Failed to get notification status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params['id']
    });

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get notification status',
      correlationId
    });
  }
});

/**
 * GET /api/v1/notifications
 * Listar todas as notificações
 */
router.get('/', async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  try {
    requestLogger.info('Listing all notifications');
    
    const notifications = notificationService.getAllNotifications();
    
    requestLogger.info('Notifications listed', {
      count: notifications.length
    });

    res.json({
      notifications,
      count: notifications.length,
      correlationId
    });

  } catch (error) {
    requestLogger.error('Failed to list notifications', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to list notifications',
      correlationId
    });
  }
});

export { router as notificationRoutes };
