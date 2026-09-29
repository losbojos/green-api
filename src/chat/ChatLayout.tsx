import { useEffect, useMemo, useRef, useState } from 'react';
import { GreenApiClient, MAX_RECEIVE_TIMEOUT } from '../api/client';
import type { AuthCredentials } from '../auth/AuthCredentials';
import { ChatListItem } from './ChatListItem';
import { getChats, saveChats } from './chatStorage';
import { FindByPhoneModal } from './FindByPhoneModal';
import './ChatLayout.css';
import { ChatWindow } from './ChatWindow';
import type { Chat, ChatMessage } from '../model/types';
import { Button } from '../ui/Button';

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

	const [chats, setChats] = useState(() =>
		getChats(credentials.idInstance).map((c) => ({ ...c, unread: 0 })),
	);
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
	const [isFindOpen, setIsFindOpen] = useState(false);
	const [error, setError] = useState('');
	const [receiveError, setReceiveError] = useState('');
	const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(
		new Map<string, ChatMessage[]>(),
	);
	const chatsRef = useRef(chats);
	const selectedChatRef = useRef(selectedChat);

	useEffect(() => {
		chatsRef.current = chats;
		selectedChatRef.current = selectedChat;
	}, [chats, selectedChat]);

	useEffect(() => {
		saveChats(credentials.idInstance, chats);
	}, [chats, credentials.idInstance]);

	useEffect(() => {
		const controller = new AbortController();

		async function poll() {
			while (!controller.signal.aborted) {
				try {
					const message = await client.receiveTextMessage(
						MAX_RECEIVE_TIMEOUT,
						controller.signal,
					);
					setReceiveError('');
					if (!message) continue;
					if (!chatsRef.current.some((chat) => chat.id === message.chatId)) {
						continue; // Игнорим сообщения для которых у нас нет чатов (потому что нет пользователей в списке)
					}

					setMessages((prev) => {
						const next = new Map(prev);
						const list = next.get(message.chatId) ?? [];
						next.set(message.chatId, [...list, message]);
						return next;
					});

					if (selectedChatRef.current?.id !== message.chatId) {
						setChats((prev) =>
							prev.map((c) =>
								c.id === message.chatId ? { ...c, unread: c.unread + 1 } : c,
							),
						);
					}
				} catch (e) {
					if (controller.signal.aborted) break;
					console.error(e);
					setReceiveError('Не удалось получить сообщения');
					await new Promise((r) => setTimeout(r, 2000));
				}
			}
		}

		poll();
		return () => controller.abort();
	}, [client]);

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
			setReceiveError('');
			setIsFindOpen(false);
		} catch (e) {
			console.error(e);
			setError('Не удалось найти пользователя');
		}
	}

	function selectChat(chat: Chat) {
		setReceiveError('');
		const opened = { ...chat, unread: 0 };
		setChats((prev) => prev.map((c) => (c.id === chat.id ? opened : c)));
		setSelectedChat(opened);
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
					chatId,
					text,
					direction: 'outgoing',
					timestamp: Date.now(),
				},
			]);
			return next;
		});
	}

	return (
		<div className={`chat-layout${selectedChat ? ' chat-open' : ''}`}>
			<aside className="chat-sidebar">
				<div className="chat-sidebar__header">
					<h2 className="chat-sidebar__title">Чаты</h2>
					<Button
						type="button"
						onClick={() => {
							setError('');
							setIsFindOpen(true);
						}}
					>
						+
					</Button>
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
								onSelect={() => selectChat(chat)}
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
					onBack={() => setSelectedChat(null)}
					receiveError={receiveError}
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
