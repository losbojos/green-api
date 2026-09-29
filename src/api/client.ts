import type { ChatMessage } from '../model/types';

export const MIN_RECEIVE_TIMEOUT = 5;
export const MAX_RECEIVE_TIMEOUT = 60;

export class GreenApiClient {
	private apiUrl: string;
	private idInstance: string;
	private apiTokenInstance: string;

	constructor(apiUrl: string, idInstance: string, apiTokenInstance: string) {
		this.apiUrl = apiUrl;
		this.idInstance = idInstance;
		this.apiTokenInstance = apiTokenInstance;
	}

	private url(method: string, extra = '') {
		return `${this.apiUrl}/waInstance${this.idInstance}/${method}/${this.apiTokenInstance}${extra}`;
	}

	async setSettings(settings: {
		webhookUrl?: string;
		incomingWebhook?: 'yes' | 'no';
	}): Promise<boolean> {
		const response = await fetch(this.url('setSettings'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(settings),
		});

		if (!response.ok) {
			throw new Error(`setSettings HTTP ${response.status}`);
		}

		const data = (await response.json()) as { saveSettings: boolean };
		return data.saveSettings;
	}

	async checkAccount(phoneNumber: number): Promise<string | null> {
		const response = await fetch(this.url('checkAccount'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phoneNumber }),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(`checkAccount ${response.status}: ${body}`);
		}

		const data = (await response.json()) as {
			exist: boolean;
			chatId: string;
		};
		return data.exist ? data.chatId : null;
	}

	async getContactInfo(chatId: string): Promise<{
		avatar: string;
		name: string;
		contactName: string;
	}> {
		const response = await fetch(this.url('getContactInfo'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chatId }),
		});

		if (!response.ok) {
			throw new Error(`getContactInfo HTTP ${response.status}`);
		}

		return (await response.json()) as {
			avatar: string;
			name: string;
			contactName: string;
		};
	}

	async sendMessage(chatId: string, message: string): Promise<string> {
		const response = await fetch(this.url('sendMessage'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chatId, message }),
		});

		if (!response.ok) {
			throw new Error(`sendMessage HTTP ${response.status}`);
		}

		const data = (await response.json()) as { idMessage: string };
		return data.idMessage;
	}

	async receiveTextMessage(
		seconds = MIN_RECEIVE_TIMEOUT,
		signal?: AbortSignal,
	): Promise<ChatMessage | null> {
		const body = await this.receiveMessage(seconds, signal);
		if (!body || body.typeWebhook !== 'incomingMessageReceived') {
			return null;
		}

		const { messageData } = body;
		if (!messageData?.typeMessage) {
			return null;
		}

		let text: string | null = null;
		switch (messageData.typeMessage) {
			case 'textMessage':
			case 'editedMessage':
				text = messageData.textMessageData?.textMessage ?? null;
				break;

			case 'extendedTextMessage':
			case 'quotedMessage':
				text = messageData.extendedTextMessageData?.text ?? null;
				break;

			default:
				text = null;
		}

		if (!text || text.trim() === '') {
			return null;
		}

		return {
			id: body.idMessage,
			chatId: body.senderData.chatId,
			text,
			direction: 'incoming',
			timestamp: Number(body.timestamp) * 1000,
		};
	}

	async receiveMessage(
		seconds = MIN_RECEIVE_TIMEOUT,
		signal?: AbortSignal,
	): Promise<IncomingNotificationBody | null> {
		if (
			!Number.isInteger(seconds) ||
			seconds < MIN_RECEIVE_TIMEOUT ||
			seconds > MAX_RECEIVE_TIMEOUT
		) {
			throw new Error(
				`receiveTimeout: ожидается целое ${MIN_RECEIVE_TIMEOUT}..${MAX_RECEIVE_TIMEOUT}, пришло ${seconds}`,
			);
		}

		const response = await fetch(
			this.url('receiveNotification', `?receiveTimeout=${seconds}`),
			{ method: 'GET', signal },
		);

		if (!response.ok) {
			throw new Error(`receiveNotification HTTP ${response.status}`);
		}

		const data = (await response.json()) as {
			receiptId: number;
			body: IncomingNotificationBody;
		} | null;

		if (!data) {
			return null;
		}

		await this.deleteNotification(data.receiptId);
		return data.body;
	}

	private async deleteNotification(receiptId: number): Promise<void> {
		const response = await fetch(
			this.url('deleteNotification', `/${receiptId}`),
			{ method: 'DELETE' },
		);

		if (!response.ok) {
			throw new Error(`deleteNotification HTTP ${response.status}`);
		}

		const data = (await response.json()) as {
			result: boolean;
			reason?: string;
		};
		if (!data.result) {
			const reason = data.reason ?? '';
			// Ошибки удаления почему то возникают
			if (/not found/i.test(reason)) {
				console.log(`not found: ${reason}`);
				return;
			}
			throw new Error(`не удалось удалить уведомление из очереди: ${reason}`);
		}
	}
}

export type IncomingNotificationBody = {
	typeWebhook: string;
	timestamp: number;
	idMessage: string;
	senderData: {
		chatId: string;
	};
	messageData: {
		typeMessage: string;
		textMessageData?: {
			textMessage: string;
		};
		extendedTextMessageData?: {
			text: string;
		};
	};
};
