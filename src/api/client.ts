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
	): Promise<string | null> {
		const body = await this.receiveMessage(seconds);
		if (!body || body.typeWebhook !== 'incomingMessageReceived') {
			return null;
		}

		const { messageData } = body;
		if (!messageData?.typeMessage) {
			return null;
		}

		switch (messageData.typeMessage) {
			case 'textMessage':
			case 'editedMessage':
				return messageData.textMessageData?.textMessage ?? null;
			case 'extendedTextMessage':
			case 'quotedMessage':
				return messageData.extendedTextMessageData?.text ?? null;
			default:
				return null;
		}
	}

	async receiveMessage(
		seconds = MIN_RECEIVE_TIMEOUT,
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
			{ method: 'GET' },
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
			throw new Error(
				`не удалось удалить уведомление из очереди: ${data.reason}`,
			);
		}
	}
}

export type IncomingNotificationBody = {
	typeWebhook: string;
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
