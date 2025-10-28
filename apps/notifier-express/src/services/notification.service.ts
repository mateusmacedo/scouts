import type { Logger } from '@scouts/logger-node';
import { v4 as uuidv4 } from 'uuid';

export interface EmailNotification {
	to: string;
	subject: string;
	body: string;
	template?: string;
	variables?: Record<string, unknown>;
}

export interface SMSNotification {
	to: string;
	message: string;
	template?: string;
	variables?: Record<string, unknown>;
}

export interface NotificationResult {
	id: string;
	status: 'pending' | 'sent' | 'failed';
	type: 'email' | 'sms';
	recipient: string;
	createdAt: string;
	sentAt?: string;
	error?: string;
}

/**
 * Serviço de notificações com retry logic e logging detalhado
 * Demonstra uso direto do logger-node para logging de negócio
 */
export class NotificationService {
	private notifications: Map<string, NotificationResult> = new Map();
	private readonly maxRetries = 3;
	private readonly retryDelay = 1000; // 1 segundo

	constructor(private readonly logger: Logger) {}

	/**
	 * Enviar notificação por email
	 */
	async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
		const id = uuidv4();
		const startTime = Date.now();

		this.logger.info('Starting email notification', {
			id,
			to: notification.to,
			subject: notification.subject,
			template: notification.template,
		});

		const result: NotificationResult = {
			id,
			status: 'pending',
			type: 'email',
			recipient: notification.to,
			createdAt: new Date().toISOString(),
		};

		this.notifications.set(id, result);

		try {
			// Simular envio de email (em produção seria integração real)
			await this.simulateEmailSend(notification);

			result.status = 'sent';
			result.sentAt = new Date().toISOString();

			const duration = Date.now() - startTime;
			this.logger.info('Email notification sent successfully', {
				id,
				to: notification.to,
				subject: notification.subject,
				duration: `${duration}ms`,
			});
		} catch (error) {
			result.status = 'failed';
			result.error = error instanceof Error ? error.message : 'Unknown error';

			this.logger.error('Email notification failed', {
				id,
				to: notification.to,
				subject: notification.subject,
				error: result.error,
			});
		}

		this.notifications.set(id, result);
		return result;
	}

	/**
	 * Enviar notificação por SMS
	 */
	async sendSMS(notification: SMSNotification): Promise<NotificationResult> {
		const id = uuidv4();
		const startTime = Date.now();

		this.logger.info('Starting SMS notification', {
			id,
			to: notification.to,
			template: notification.template,
		});

		const result: NotificationResult = {
			id,
			status: 'pending',
			type: 'sms',
			recipient: notification.to,
			createdAt: new Date().toISOString(),
		};

		this.notifications.set(id, result);

		try {
			// Simular envio de SMS (em produção seria integração real)
			await this.simulateSMSSend(notification);

			result.status = 'sent';
			result.sentAt = new Date().toISOString();

			const duration = Date.now() - startTime;
			this.logger.info('SMS notification sent successfully', {
				id,
				to: notification.to,
				duration: `${duration}ms`,
			});
		} catch (error) {
			result.status = 'failed';
			result.error = error instanceof Error ? error.message : 'Unknown error';

			this.logger.error('SMS notification failed', {
				id,
				to: notification.to,
				error: result.error,
			});
		}

		this.notifications.set(id, result);
		return result;
	}

	/**
	 * Obter status de uma notificação
	 */
	getStatus(id: string): NotificationResult | null {
		return this.notifications.get(id) || null;
	}

	/**
	 * Listar todas as notificações
	 */
	getAllNotifications(): NotificationResult[] {
		return Array.from(this.notifications.values());
	}

	/**
	 * Simular envio de email com retry logic
	 */
	private async simulateEmailSend(notification: EmailNotification): Promise<void> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				this.logger.debug('Email send attempt', {
					attempt,
					to: notification.to,
					subject: notification.subject,
				});

				// Simular falha ocasional (20% de chance)
				if (Math.random() < 0.2) {
					throw new Error(`Email service temporarily unavailable (attempt ${attempt})`);
				}

				// Simular delay de rede
				await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

				this.logger.info('Email sent successfully', {
					attempt,
					to: notification.to,
					subject: notification.subject,
				});

				return; // Sucesso
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');

				this.logger.warn('Email send attempt failed', {
					attempt,
					to: notification.to,
					subject: notification.subject,
					error: lastError.message,
				});

				if (attempt < this.maxRetries) {
					const delay = this.retryDelay * 2 ** (attempt - 1); // Exponential backoff
					this.logger.debug('Retrying email send', {
						attempt,
						delay: `${delay}ms`,
						to: notification.to,
					});

					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// Se chegou aqui, todas as tentativas falharam
		throw lastError || new Error('Email send failed after all retries');
	}

	/**
	 * Simular envio de SMS com retry logic
	 */
	private async simulateSMSSend(notification: SMSNotification): Promise<void> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				this.logger.debug('SMS send attempt', {
					attempt,
					to: notification.to,
				});

				// Simular falha ocasional (15% de chance)
				if (Math.random() < 0.15) {
					throw new Error(`SMS service temporarily unavailable (attempt ${attempt})`);
				}

				// Simular delay de rede
				await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

				this.logger.info('SMS sent successfully', {
					attempt,
					to: notification.to,
				});

				return; // Sucesso
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');

				this.logger.warn('SMS send attempt failed', {
					attempt,
					to: notification.to,
					error: lastError.message,
				});

				if (attempt < this.maxRetries) {
					const delay = this.retryDelay * 2 ** (attempt - 1); // Exponential backoff
					this.logger.debug('Retrying SMS send', {
						attempt,
						delay: `${delay}ms`,
						to: notification.to,
					});

					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// Se chegou aqui, todas as tentativas falharam
		throw lastError || new Error('SMS send failed after all retries');
	}
}
