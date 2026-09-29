import type { Chat } from './types';

function storageKey(idInstance: string) {
	return `green-api-chats:${idInstance}`;
}

function isChat(value: unknown): value is Chat {
	if (!value || typeof value !== 'object') return false;
	const c = value as Record<string, unknown>;
	return (
		typeof c.id === 'string' &&
		typeof c.phone === 'string' &&
		typeof c.name === 'string' &&
		typeof c.avatar === 'string' &&
		typeof c.unread === 'number'
	);
}

export function getChats(idInstance: string): Chat[] {
	try {
		const raw = localStorage.getItem(storageKey(idInstance));
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			localStorage.removeItem(storageKey(idInstance));
			return [];
		}

		return parsed.filter(isChat);
	} catch {
		localStorage.removeItem(storageKey(idInstance));
		return [];
	}
}

export function saveChats(idInstance: string, chats: Chat[]) {
	localStorage.setItem(storageKey(idInstance), JSON.stringify(chats));
}
