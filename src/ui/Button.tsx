import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', ...props }: Props) {
	return <button className={`btn${className ? ` ${className}` : ''}`} {...props} />;
}
