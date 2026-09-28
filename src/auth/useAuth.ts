import { useState } from 'react';
import { GreenApiClient } from '../api/client';
import type { AuthCredentials } from './AuthCredentials';
import {
	clearCredentials,
	getCredentials,
	saveCredentials,
} from './authStorage';

export function useAuth() {
	const [credentials, setCredentials] = useState(() => getCredentials());
	const [isEditingCredentials, setIsEditingCredentials] =
		useState(!credentials);

	async function login(next: AuthCredentials) {
		saveCredentials(next);
		setCredentials(next);
		setIsEditingCredentials(false);

		const client = new GreenApiClient(
			next.apiUrl,
			next.idInstance,
			next.apiTokenInstance,
		);

		try {
			await client.setSettings({
				webhookUrl: '',
				incomingWebhook: 'yes',
			});
		} catch (error) {
			console.error('setSettings не применился', error);
		}
	}

	function logout() {
		clearCredentials();
		setCredentials(null);
		setIsEditingCredentials(true);
	}

	function openCredentialsEditor() {
		setIsEditingCredentials(true);
	}

	function closeCredentialsEditor() {
		if (credentials) {
			setIsEditingCredentials(false);
		}
	}

	return {
		credentials,
		isEditingCredentials,
		login,
		logout,
		openCredentialsEditor,
		closeCredentialsEditor,
	};
}
