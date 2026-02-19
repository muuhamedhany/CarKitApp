import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@/constants/config';

// Ensures the browser session completes properly
WebBrowser.maybeCompleteAuthSession();

type GoogleUserInfo = {
  email: string;
  name: string;
  picture: string;
  id: string;
};

type GoogleAuthResult = {
  userInfo: GoogleUserInfo | null;
  error: string | null;
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Add later for Android
  });

  const getGoogleUser = async (accessToken: string): Promise<GoogleAuthResult> => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await res.json();
      return { userInfo, error: null };
    } catch {
      return { userInfo: null, error: 'Could not fetch Google profile.' };
    }
  };

  return {
    request,
    response,
    promptAsync,
    getGoogleUser,
  };
}
