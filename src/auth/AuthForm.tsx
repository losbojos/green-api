import { useState } from 'react';
import type { AuthCredentials } from './AuthCredentials';
import { DEFAULT_GREEN_API_URL } from '../api/config';
import './AuthForm.css';

type AuthFormProps = {
	initial?: AuthCredentials | null;
	onSubmit: (credentials: AuthCredentials) => void;
	onCancel?: () => void;
};

const emptyCredentials = (): AuthCredentials => ({
	apiUrl: DEFAULT_GREEN_API_URL,
	idInstance: '',
	apiTokenInstance: '',
});

export function AuthForm({ initial, onSubmit, onCancel }: AuthFormProps) {
	const [credentials, setCredentials] = useState(initial ?? emptyCredentials());
	const [error, setError] = useState('');

	function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const next: AuthCredentials = {
			apiUrl: credentials.apiUrl.trim() || DEFAULT_GREEN_API_URL,
			idInstance: credentials.idInstance.trim(),
			apiTokenInstance: credentials.apiTokenInstance.trim(),
		};

		if (!next.idInstance || !next.apiTokenInstance) {
			setError('Заполните idInstance и apiTokenInstance');
			return;
		}

		setError('');
		onSubmit(next);
	}

	return (
		<form onSubmit={handleSubmit} className="auth-form">
			<div className="auth-form__container">
				<div className="auth-form__inputs-group">
					<label className="auth-form__label">
						<span>GREEN-API URL</span>
						<input
							className="auth-form__input"
							type="url"
							placeholder={DEFAULT_GREEN_API_URL}
							value={credentials.apiUrl}
							onChange={(e) => {
								setError('');
								setCredentials({ ...credentials, apiUrl: e.target.value });
							}}
						/>
					</label>
					<label className="auth-form__label">
						<span>ID Instance</span>
						<input
							className="auth-form__input"
							type="text"
							placeholder="ID Instance"
							value={credentials.idInstance}
							onChange={(e) => {
								setError('');
								setCredentials({ ...credentials, idInstance: e.target.value });
							}}
						/>
					</label>
					<label className="auth-form__label">
						<span>API Token Instance</span>
						<input
							className="auth-form__input"
							type="password"
							placeholder="API Token Instance"
							value={credentials.apiTokenInstance}
							onChange={(e) => {
								setError('');
								setCredentials({
									...credentials,
									apiTokenInstance: e.target.value,
								});
							}}
						/>
					</label>
				</div>

				<div className="auth-form__buttons-group">
					{onCancel && (
						<button
							type="button"
							className="auth-form__button"
							onClick={onCancel}
						>
							Cancel
						</button>
					)}
					<button type="submit" className="auth-form__button">
						Save
					</button>
				</div>

				{error ? <p className="auth-form__error">{error}</p> : null}
			</div>
		</form>
	);
}
