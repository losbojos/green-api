export type Chat = {
	id: string;
	phone: string;
	name: string;
	avatar: string;
	unread: number;
};

export type MessageDirection = 'outgoing' | 'incoming';

export type ChatMessage = {
	id: string;
	chatId: string;
	text: string;
	direction: MessageDirection;
	timestamp: number;
};
