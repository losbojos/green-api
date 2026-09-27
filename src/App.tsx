import './App.css';
import { AuthForm } from './auth/AuthForm';
import { useAuth } from './auth/useAuth';

function App() {
	const {
		credentials,
		isEditingCredentials,
		login,
		logout,
		openCredentialsEditor,
		closeCredentialsEditor,
	} = useAuth();

	if (isEditingCredentials) {
		return (
			<AuthForm
				initial={credentials}
				onSubmit={login}
				onCancel={credentials ? closeCredentialsEditor : undefined}
			/>
		);
	}

	return (
		<section className="page">
			<header className="page-header">
				<div>
					<h1>GREEN-API</h1>
					<p className="page-header__meta">
						idInstance: <code>{credentials?.idInstance}</code>
					</p>
				</div>
				<div className="page-header__actions">
					<button type="button" onClick={openCredentialsEditor}>
						Авторизация
					</button>
					<button type="button" className="button-secondary" onClick={logout}>
						Выйти
					</button>
				</div>
			</header>

			<main className="page-main">
				<p>Здесь окно основное.</p>
			</main>
		</section>
	);
}

export default App;
