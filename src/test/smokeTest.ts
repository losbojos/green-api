/// <reference types="node" />

import {
	GreenApiClient,
	MAX_RECEIVE_TIMEOUT,
	MIN_RECEIVE_TIMEOUT,
} from '../api/client';
import { DEFAULT_GREEN_API_URL } from '../api/config';

const MESSAGE = 'Привет тебе из тестового приложения!';

function env(name: string): string | undefined {
	return process.env[name]?.trim();
}

function requireEnv(name: string): string {
	const value = env(name);
	if (!value) {
		throw new Error(`Нет переменной ${name} в .env`);
	}
	return value;
}

function readTestPhone(): number {
	const phone = Number(requireEnv('TEST_PHONE'));
	if (!Number.isInteger(phone) || phone <= 0) {
		throw new Error('TEST_PHONE должен быть целым числом');
	}
	return phone;
}

function readWaitSec(): number {
	const seconds = Number(requireEnv('TEST_WAIT_NOTIFICATIONS'));
	if (!Number.isInteger(seconds) || seconds < MIN_RECEIVE_TIMEOUT) {
		throw new Error(`TEST_WAIT_NOTIFICATIONS >= ${MIN_RECEIVE_TIMEOUT}`);
	}
	return seconds;
}

async function main() {
	const apiUrl = env('GREEN_API_URL') || DEFAULT_GREEN_API_URL;
	const idInstance = requireEnv('GREEN_API_ID_INSTANCE');
	const apiTokenInstance = requireEnv('GREEN_API_TOKEN_INSTANCE');
	const phone = readTestPhone();
	const waitSec = readWaitSec();

	const client = new GreenApiClient(apiUrl, idInstance, apiTokenInstance);

	console.log('setSettings...');
	console.log(
		await client.setSettings({
			webhookUrl: '',
			incomingWebhook: 'yes',
		}),
	);

	console.log('checkAccount', phone);
	const chatId = await client.checkAccount(phone);
	if (!chatId) {
		throw new Error(`Нет MAX на номере ${phone}`);
	}
	console.log('chatId', chatId);

	console.log('sendMessage...');
	console.log(await client.sendMessage(chatId, MESSAGE));

	console.log(`ждём входящие ${waitSec}с`);
	const deadline = Date.now() + waitSec * 1000;
	let count = 0;

	while (Date.now() < deadline) {
		const left = Math.ceil((deadline - Date.now()) / 1000);
		if (left < MIN_RECEIVE_TIMEOUT) {
			break;
		}

		const message = await client.receiveTextMessage(
			Math.min(MAX_RECEIVE_TIMEOUT, left),
		);
		if (message) {
			count += 1;
			console.log(
				`входящее: ${new Date(message.timestamp).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				})} ${message.text}`,
			);
		}
	}

	console.log(count ? `всего входящих: ${count}` : 'входящих не было');
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
