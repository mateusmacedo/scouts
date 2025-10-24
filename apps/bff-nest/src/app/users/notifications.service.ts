import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry, catchError, throwError, timer } from 'rxjs';
import { AxiosError } from 'axios';
import { AdvancedLoggerService } from '@scouts/utils-nest';
import { User } from '@scouts/user-node';

export interface EmailNotificationRequest {
  to: string;
  subject: string;
  body: string;
  template?: string;
  variables?: Record<string, any>;
}

export interface SMSNotificationRequest {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  status: 'pending' | 'sent' | 'failed';
  type: 'email' | 'sms';
  recipient: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

/**
 * Serviço de orquestração para notificações
 * Demonstra integração entre bff-nest e express-notifier
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 segundo

  constructor(
    private readonly httpService: HttpService,
    private readonly advancedLogger: AdvancedLoggerService
  ) {}

  /**
   * Enviar email de boas-vindas para novo usuário
   */
  async sendWelcomeEmail(user: User): Promise<NotificationResponse> {
    const correlationId = this.generateCorrelationId();
    
    this.advancedLogger.logBusinessEvent('welcome_email_requested', {
      userId: user.id,
      userEmail: user.email,
      correlationId
    });

    const emailRequest: EmailNotificationRequest = {
      to: user.email,
      subject: 'Bem-vindo ao Scouts!',
      body: `Olá ${user.name}, bem-vindo ao nosso sistema!`,
      template: 'welcome',
      variables: {
        userName: user.name,
        userEmail: user.email,
        userId: user.id
      }
    };

    try {
      const response = await this.sendEmailNotification(emailRequest, correlationId);
      
      this.advancedLogger.logBusinessEvent('welcome_email_sent', {
        userId: user.id,
        notificationId: response.id,
        status: response.status,
        correlationId
      });

      return response;

    } catch (error) {
      this.advancedLogger.error('Failed to send welcome email', {
        userId: user.id,
        userEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });

      throw error;
    }
  }

  /**
   * Enviar notificação SMS de atualização de usuário
   */
  async sendUserUpdateNotification(user: User): Promise<NotificationResponse> {
    const correlationId = this.generateCorrelationId();
    
    this.advancedLogger.logBusinessEvent('user_update_notification_requested', {
      userId: user.id,
      userPhone: user.phone,
      correlationId
    });

    const smsRequest: SMSNotificationRequest = {
      to: user.phone || '',
      message: `Olá ${user.name}, seus dados foram atualizados com sucesso!`,
      template: 'user_update',
      variables: {
        userName: user.name,
        userId: user.id
      }
    };

    try {
      const response = await this.sendSMSNotification(smsRequest, correlationId);
      
      this.advancedLogger.logBusinessEvent('user_update_notification_sent', {
        userId: user.id,
        notificationId: response.id,
        status: response.status,
        correlationId
      });

      return response;

    } catch (error) {
      this.advancedLogger.error('Failed to send user update notification', {
        userId: user.id,
        userPhone: user.phone,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });

      throw error;
    }
  }

  /**
   * Verificar status de uma notificação
   */
  async getNotificationStatus(notificationId: string): Promise<NotificationResponse | null> {
    const correlationId = this.generateCorrelationId();
    
    this.advancedLogger.debug('Getting notification status', {
      notificationId,
      correlationId
    });

    try {
      const response = await firstValueFrom(
        this.httpService.get<NotificationResponse>(
          `/api/v1/notifications/${notificationId}/status`,
          {
            headers: {
              'x-correlation-id': correlationId
            }
          }
        ).pipe(
        retry({
          count: this.maxRetries,
          delay: (error, retryCount) => {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            this.logger.warn(`Retrying notification status check (attempt ${retryCount})`, {
              notificationId,
              delay: `${delay}ms`,
              correlationId
            });
            return timer(delay);
          }
        }),
          catchError((error: AxiosError) => {
            this.advancedLogger.error('Failed to get notification status', {
              notificationId,
              status: error.response?.status,
              error: error.message,
              correlationId
            });
            return throwError(() => error);
          })
        )
      );

      this.advancedLogger.debug('Notification status retrieved', {
        notificationId,
        status: response.data.status,
        correlationId
      });

      return response.data;

    } catch (error) {
      this.advancedLogger.error('Failed to get notification status after retries', {
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });

      return null;
    }
  }

  /**
   * Enviar notificação por email via express-notifier
   */
  private async sendEmailNotification(
    request: EmailNotificationRequest, 
    correlationId: string
  ): Promise<NotificationResponse> {
    this.advancedLogger.debug('Sending email notification', {
      to: request.to,
      subject: request.subject,
      correlationId
    });

    const response = await firstValueFrom(
      this.httpService.post<NotificationResponse>(
        '/api/v1/notifications/email',
        request,
        {
          headers: {
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          }
        }
      ).pipe(
        retry({
          count: this.maxRetries,
          delay: (error, retryCount) => {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            this.logger.warn(`Retrying email notification (attempt ${retryCount})`, {
              to: request.to,
              delay: `${delay}ms`,
              correlationId
            });
            return timer(delay);
          }
        }),
        catchError((error: AxiosError) => {
          this.advancedLogger.error('Email notification failed', {
            to: request.to,
            subject: request.subject,
            status: error.response?.status,
            error: error.message,
            correlationId
          });
          return throwError(() => error);
        })
      )
    );

    this.advancedLogger.info('Email notification sent successfully', {
      notificationId: response.data.id,
      to: request.to,
      status: response.data.status,
      correlationId
    });

    return response.data;
  }

  /**
   * Enviar notificação por SMS via express-notifier
   */
  private async sendSMSNotification(
    request: SMSNotificationRequest, 
    correlationId: string
  ): Promise<NotificationResponse> {
    this.advancedLogger.debug('Sending SMS notification', {
      to: request.to,
      correlationId
    });

    const response = await firstValueFrom(
      this.httpService.post<NotificationResponse>(
        '/api/v1/notifications/sms',
        request,
        {
          headers: {
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          }
        }
      ).pipe(
        retry({
          count: this.maxRetries,
          delay: (error, retryCount) => {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            this.logger.warn(`Retrying SMS notification (attempt ${retryCount})`, {
              to: request.to,
              delay: `${delay}ms`,
              correlationId
            });
            return timer(delay);
          }
        }),
        catchError((error: AxiosError) => {
          this.advancedLogger.error('SMS notification failed', {
            to: request.to,
            status: error.response?.status,
            error: error.message,
            correlationId
          });
          return throwError(() => error);
        })
      )
    );

    this.advancedLogger.info('SMS notification sent successfully', {
      notificationId: response.data.id,
      to: request.to,
      status: response.data.status,
      correlationId
    });

    return response.data;
  }

  /**
   * Gerar correlation ID único
   */
  private generateCorrelationId(): string {
    return `bff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
