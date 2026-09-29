import {
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type SubmitEvent,
} from 'react';
import { Button } from '../ui/Button';
import { ChatListItem } from './ChatListItem';
import type { Chat, ChatMessage } from '../model/types';
import './ChatWindow.css';

type Props = {
	chat: Chat;
	messages: ChatMessage[];
	onSend: (text: string) => Promise<void>;
};

export function ChatWindow({ chat, messages, onSend }: Props) {
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;

		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [text]);

	useEffect(() => {
		const el = listRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const value = text.trim();
		if (!value || sending) return;

		setSending(true);
		try {
			await onSend(value);
			setText('');
		} catch (err) {
			console.error(err);
		} finally {
			setSending(false);
			textareaRef.current?.focus();
		}
	}

	function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	}

	return (
		<section className="chat-window">
			<ChatListItem chat={chat} selected={false} onSelect={() => {}} />
			<div className="chat-window__message-list" ref={listRef}>
				{messages.map((msg) => (
					<div key={msg.id} className={`chat-message ${msg.direction}`}>
						<p className="chat-message__text">{msg.text}</p>
						<time className="chat-message__time">
							{new Date(msg.timestamp).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</time>
					</div>
				))}
			</div>
			<form
				className={`chat-window__sender${sending ? ' sending' : ''}`}
				onSubmit={submit}
			>
				<textarea
					ref={textareaRef}
					rows={1}
					placeholder="Сообщение"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={onKeyDown}
					readOnly={sending}
				/>
				<Button type="submit" disabled={sending || !text.trim()}>
					{sending ? '...' : '>'}
				</Button>
			</form>
		</section>
	);
}
