import type { Chat } from '../model/types';
import './ChatListItem.css';

type Props = {
	chat: Chat;
	selected: boolean;
	onSelect: () => void;
};

export function ChatListItem({ chat, selected, onSelect }: Props) {
	return (
		<div
			className={`chat-item${selected ? ' selected' : ''}`}
			onClick={onSelect}
		>
			{chat.avatar ? (
				<img src={chat.avatar} alt="" />
			) : (
				<span className="chat-item__photo" />
			)}
			<span className="chat-item__body">
				<span className="chat-item__name">{chat.name}</span>
				<span className="chat-item__phone">{chat.phone}</span>
			</span>
			{chat.unread > 0 && (
				<span className="chat-item__unread">{chat.unread}</span>
			)}
		</div>
	);
}
