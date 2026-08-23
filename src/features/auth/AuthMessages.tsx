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
    <p className="rounded-card border border-hoopjot-danger/40 bg-hoopjot-danger/10 px-4 py-3 text-sm font-bold text-hoopjot-ink">
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
    <p className="rounded-card border border-hoopjot-success/40 bg-hoopjot-success/10 px-4 py-3 text-sm font-bold text-hoopjot-ink">
      {message}
    </p>
  );
}

