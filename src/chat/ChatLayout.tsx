import { useEffect, useMemo, useState } from 'react';
import { GreenApiClient } from '../api/client';
import type { AuthCredentials } from '../auth/AuthCredentials';
import { ChatListItem } from './ChatListItem';
import { getChats, saveChats } from './chatStorage';
import { FindByPhoneModal } from './FindByPhoneModal';
import './ChatLayout.css';
import { ChatWindow } from './ChatWindow';
import type { Chat, ChatMessage } from './types';

type Props = {
	credentials: AuthCredentials;
};

export function ChatLayout({ credentials }: Props) {
	const client = useMemo(
		() =>
			new GreenApiClient(
				credentials.apiUrl,
				credentials.idInstance,
				credentials.apiTokenInstance,
			),
		[credentials],
	);

	const [chats, setChats] = useState(() => getChats(credentials.idInstance));
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
	const [isFindOpen, setIsFindOpen] = useState(false);
	const [error, setError] = useState('');
	const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(
		new Map<string, ChatMessage[]>(),
	);

	useEffect(() => {
		saveChats(credentials.idInstance, chats);
	}, [chats, credentials.idInstance]);

	async function findByPhone(phoneRaw: string) {
		const phone = phoneRaw.replace(/\D/g, '');
		if (!phone) return;

		setError('');
		try {
			const chatId = await client.checkAccount(Number(phone));
			if (!chatId) {
				setError('Пользователь не найден в MAX');
				return;
			}

			const info = await client.getContactInfo(chatId);
			const newChat = {
				id: chatId,
				phone,
				name: info.name || info.contactName || phone,
				avatar: info.avatar || '',
				unread: 0,
			};

			setChats((prev) => {
				let found = false;
				const next = prev.map((c) => {
					if (c.id !== chatId) return c;
					found = true;
					return newChat;
				});
				return found ? next : [...prev, newChat];
			});

			setSelectedChat(newChat);
			setIsFindOpen(false);
		} catch (e) {
			console.error(e);
			setError('Не удалось найти пользователя');
		}
	}

	async function sendMessage(text: string) {
		if (!selectedChat) return;

		const chatId = selectedChat.id;
		const idMessage = await client.sendMessage(chatId, text);

		setMessages((prev) => {
			const next = new Map(prev);
			next.set(chatId, [
				...(next.get(chatId) ?? []),
				{
					id: idMessage,
					text,
					direction: 'outgoing',
					timestamp: Date.now(),
				},
			]);
			return next;
		});
	}

	return (
		<div className="chat-layout">
			<aside className="chat-sidebar">
				<div className="chat-sidebar__header">
					<h2 className="chat-sidebar__title">Чаты</h2>
					<button
						type="button"
						className="chat-sidebar__new"
						onClick={() => {
							setError('');
							setIsFindOpen(true);
						}}
					>
						+
					</button>
				</div>
				<div className="chat-sidebar__list">
					{chats.length === 0 ? (
						<p className="chat-sidebar__empty">Нет чатов</p>
					) : (
						chats.map((chat) => (
							<ChatListItem
								key={chat.id}
								chat={chat}
								selected={chat.id === selectedChat?.id}
								onSelect={() => setSelectedChat(chat)}
							/>
						))
					)}
				</div>
			</aside>

			{selectedChat ? (
				<ChatWindow
					chat={selectedChat}
					messages={messages.get(selectedChat.id) || []}
					onSend={sendMessage}
				/>
			) : (
				<section className="chat-window__placeholder">
					<p className="chat-window__placeholder-text">Выберите чат</p>
				</section>
			)}

			{isFindOpen && (
				<FindByPhoneModal
					onClose={() => setIsFindOpen(false)}
					onFind={findByPhone}
					error={error}
				/>
			)}
		</div>
	);
}
