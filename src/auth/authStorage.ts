import type { AuthCredentials } from './AuthCredentials';

const STORAGE_KEY = 'green-api-auth';

function isAuthCredentials(value: unknown): value is AuthCredentials {
	if (!value || typeof value !== 'object') return false;

	const data = value as Record<string, unknown>;
	return (
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

		return {
			idInstance: parsed.idInstance.trim(),
			apiTokenInstance: parsed.apiTokenInstance.trim(),
		};
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function clearCredentials() {
	localStorage.removeItem(STORAGE_KEY);
}
