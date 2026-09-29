import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import './FindByPhoneModal.css';

type Props = {
	onClose: () => void;
	onFind: (phone: string) => void;
	error?: string;
};

export function FindByPhoneModal({ onClose, onFind, error }: Props) {
	const [phone, setPhone] = useState('');

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	return (
		<div className="find-modal">
			<div className="find-modal__backdrop" onClick={onClose} />
			<form
				className="find-modal__panel"
				onSubmit={(e) => {
					e.preventDefault();
					onFind(phone.trim());
				}}
			>
				<h3>Найти по номеру</h3>
				<input
					type="tel"
					placeholder="79xxxxxxxxx"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
				/>
				{error && <p className="find-modal__error">{error}</p>}
				<Button type="submit">Найти в MAX</Button>
			</form>
		</div>
	);
}
