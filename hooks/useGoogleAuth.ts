import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
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
  const isExpoGo = Constants.appOwnership === 'expo';

  const redirectUri = isExpoGo
    ? 'https://auth.expo.io/@muuhamedhany/CarKitApp'
    : makeRedirectUri({ scheme: 'carkitapp' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: isExpoGo ? GOOGLE_WEB_CLIENT_ID : (Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_WEB_CLIENT_ID),
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: ResponseType.Token,
      usePKCE: false,
    },
    discovery
  );

  const promptProxyAsync = async (options?: any) => {
    if (!request) {
      throw new Error('Google Auth request not loaded yet.');
    }

    let promptUrl = request.url;

    if (isExpoGo && request.url) {
      const nativeReturnUrl = makeRedirectUri({
        scheme: 'carkitapp',
      });
      promptUrl = `https://auth.expo.io/@muuhamedhany/CarKitApp/start?authUrl=${encodeURIComponent(
        request.url
      )}&returnUrl=${encodeURIComponent(nativeReturnUrl)}`;
    }

    return await promptAsync({
      ...options,
      url: promptUrl,
    });
  };

  const getGoogleUser = async (accessToken: string): Promise<GoogleAuthResult> => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await res.json();
      
      if (userInfo.error) {
        return { userInfo: null, error: userInfo.error.message || 'Could not fetch Google profile.' };
      }
      
      return { userInfo, error: null };
    } catch {
      return { userInfo: null, error: 'Could not fetch Google profile.' };
    }
  };

  return {
    request,
    response,
    promptAsync: promptProxyAsync,
    getGoogleUser,
  };
}

