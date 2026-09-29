import { useEffect, useMemo, useState } from 'react';
import { GreenApiClient } from '../api/client';
import type { AuthCredentials } from '../auth/AuthCredentials';
import { ChatListItem } from './ChatListItem';
import { getChats, saveChats } from './chatStorage';
import { FindByPhoneModal } from './FindByPhoneModal';
import './ChatLayout.css';

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
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [isFindOpen, setIsFindOpen] = useState(false);
	const [error, setError] = useState('');

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
			setChats((prev) => {
				if (prev.some((c) => c.id === chatId)) return prev;
				return [
					...prev,
					{
						id: chatId,
						phone,
						name: info.name || info.contactName || phone,
						avatar: info.avatar || '',
						unread: 0,
					},
				];
			});
			setSelectedChatId(chatId);
			setIsFindOpen(false);
		} catch (e) {
			console.error(e);
			setError('Не удалось найти пользователя');
		}
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
								selected={chat.id === selectedChatId}
								onSelect={() => setSelectedChatId(chat.id)}
							/>
						))
					)}
				</div>
			</aside>

			<section className="chat-window">
				<p className="chat-window__placeholder">Выберите чат</p>
			</section>

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
