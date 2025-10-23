import request from 'supertest';
import express from 'express';
import { notificationRoutes } from './notifications.routes';
import { createLogger } from '../config/logger.config';

describe('Notification Routes', () => {
  let app: express.Application;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    app = express();
    app.use(express.json());
    app.use('/api/v1/notifications', notificationRoutes);
  });

  describe('POST /api/v1/notifications/email', () => {
    it('should send email notification successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      };

      const response = await request(app)
        .post('/api/v1/notifications/email')
        .send(emailData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'email');
      expect(response.body).toHaveProperty('recipient', 'test@example.com');
    });

    it('should return 400 for invalid email data', async () => {
      const invalidData = {
        to: 'test@example.com'
        // missing subject and body
      };

      const response = await request(app)
        .post('/api/v1/notifications/email')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'validation_error');
    });
  });

  describe('POST /api/v1/notifications/sms', () => {
    it('should send SMS notification successfully', async () => {
      const smsData = {
        to: '+1234567890',
        message: 'Test Message'
      };

      const response = await request(app)
        .post('/api/v1/notifications/sms')
        .send(smsData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'sms');
      expect(response.body).toHaveProperty('recipient', '+1234567890');
    });

    it('should return 400 for invalid SMS data', async () => {
      const invalidData = {
        to: '+1234567890'
        // missing message
      };

      const response = await request(app)
        .post('/api/v1/notifications/sms')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'validation_error');
    });
  });

  describe('GET /api/v1/notifications/:id/status', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/non-existent-id/status')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'not_found');
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should return list of notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });
  });
});
