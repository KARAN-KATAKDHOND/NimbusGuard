export const getFriendlyAuthError = (err: unknown, context: 'login' | 'signup'): string => {
  const defaultMessage = context === 'login'
    ? 'Failed to log in with Google.'
    : 'Failed to sign up with Google.';

  const anyErr = err as { code?: string; message?: string } | null;
  const code = anyErr?.code || '';

  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
    return `Google auth is blocked for this domain (${host}). Add it in Firebase Console -> Authentication -> Settings -> Authorized domains, then try again.`;
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing authentication.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Firebase Auth. Check your internet connection and retry.';
  }

  if (anyErr?.message) {
    return anyErr.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, '').trim() || defaultMessage;
  }

  return defaultMessage;
};