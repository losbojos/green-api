import { useState } from 'react';
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

	function login(next: AuthCredentials) {
		saveCredentials(next);
		setCredentials(next);
		setIsEditingCredentials(false);
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
