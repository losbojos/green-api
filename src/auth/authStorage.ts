import type { AuthCredentials } from './AuthCredentials';
import { DEFAULT_GREEN_API_URL } from '../api/config';

const STORAGE_KEY = 'green-api-auth';

function isAuthCredentials(value: unknown): value is AuthCredentials {
	if (!value || typeof value !== 'object') return false;

	const data = value as Record<string, unknown>;
	const apiUrlOk = data.apiUrl === undefined || typeof data.apiUrl === 'string';

	return (
		apiUrlOk &&
		typeof data.idInstance === 'string' &&
		data.idInstance.trim() !== '' &&
		typeof data.apiTokenInstance === 'string' &&
		data.apiTokenInstance.trim() !== ''
	);
}

export function saveCredentials(credentials: AuthCredentials) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function getCredentials(): AuthCredentials | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		if (!isAuthCredentials(parsed)) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}

		const data = parsed as {
			apiUrl?: string;
			idInstance: string;
			apiTokenInstance: string;
		};

		return {
			apiUrl: data.apiUrl?.trim() || DEFAULT_GREEN_API_URL,
			idInstance: data.idInstance.trim(),
			apiTokenInstance: data.apiTokenInstance.trim(),
		};
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function clearCredentials() {
	localStorage.removeItem(STORAGE_KEY);
}
