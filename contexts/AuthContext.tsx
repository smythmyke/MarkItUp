import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isExtension } from '../lib/platform';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = '561880138172-82rvojp47km71hub6ej6d27nl9nser5b.apps.googleusercontent.com';

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Handle redirect result on page load (web only)
    if (!isExtension) {
      getRedirectResult(auth).catch((err) => {
        console.error('Redirect sign-in error:', err);
        setError(err instanceof Error ? err.message : 'Sign-in failed');
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isExtension) {
        // Chrome extension: use chrome.identity.launchWebAuthFlow
        const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
        const scopes = encodeURIComponent('openid email profile');
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth` +
          `?client_id=${GOOGLE_CLIENT_ID}` +
          `&response_type=token` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${scopes}`;

        const responseUrl = await chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true,
        });

        if (!responseUrl) throw new Error('No response from Google sign-in');

        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) throw new Error('No access token received');

        const credential = GoogleAuthProvider.credential(null, accessToken);
        await signInWithCredential(auth, credential);
      } else {
        // Web app: use signInWithRedirect (popup blocked by GitHub Pages COOP header)
        await signInWithRedirect(auth, googleProvider);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      // Clear cached Chrome identity tokens (extension only)
      if (isExtension && chrome.identity?.clearAllCachedAuthTokens) {
        await chrome.identity.clearAllCachedAuthTokens();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
