import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // 2. Handle deep link (email confirmation)
    const handleUrl = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        // For Supabase PKCE flow, url has ?code=
        if (url.includes('code=') || url.includes('access_token') || parsed.queryParams?.type === 'signup') {
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          // Fallback for old hash flow
          if (error) {
            const { data: hashData } = await supabase.auth.getSession();
            if (hashData.session) {
              setSession(hashData.session);
              await fetchProfile(hashData.session.user.id);
              router.replace('/(tabs)');
              return;
            }
          }
          if (!error && data.session) {
            setSession(data.session);
            await fetchProfile(data.session.user.id);
            router.replace('/(tabs)');
          }
        }
      } catch (e) {
        console.log('Deep link error', e);
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // 3. Auth listener - DON'T force redirect to login here, let expo-router handle it
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      sub.remove();
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}