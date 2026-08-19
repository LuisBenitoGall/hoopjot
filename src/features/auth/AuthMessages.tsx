import { type AuthErrorCode } from '../../services/auth';

interface AuthErrorMessageProps {
  code: AuthErrorCode | null;
  getMessage: (code: AuthErrorCode) => string;
}

export function AuthErrorMessage({ code, getMessage }: AuthErrorMessageProps) {
  if (!code) {
    return null;
  }

  return (
    <p className="rounded-card border border-hoopnote-danger/40 bg-hoopnote-danger/10 px-4 py-3 text-sm font-bold text-hoopnote-ink">
      {getMessage(code)}
    </p>
  );
}

interface AuthSuccessMessageProps {
  message: string | null;
}

export function AuthSuccessMessage({ message }: AuthSuccessMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="rounded-card border border-hoopnote-success/40 bg-hoopnote-success/10 px-4 py-3 text-sm font-bold text-hoopnote-ink">
      {message}
    </p>
  );
}

