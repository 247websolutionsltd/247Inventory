import { Colors } from '@/constants/theme';
import { AppThemeProvider, AuthProvider, useAppTheme, useAuth } from '@/context/PageContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { goReplace } from '@/lib/nav';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

/** Signed-out users (or an expired session) can only see the splash, onboarding and auth screens. */
function useAuthGuard() {
  const { authReady, uid } = useAuth();
  const segments = useSegments();
  const root = segments[0] as string | undefined;

  useEffect(() => {
    if (!authReady || uid) return;
    const isPublic = !root || root === 'onboard' || root === 'auth';
    if (!isPublic) goReplace('/auth/logIn');
  }, [authReady, uid, root]);
}

function Shell() {
  useAuthGuard();
  const { themeMode } = useAppTheme();
  const c = Colors[themeMode];
  const base = themeMode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.line,
      primary: c.accent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: 'slide_from_right',
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    // Stockroom opens in the light "paper" look; users can switch to dark roast in More > Appearance.
    <AppThemeProvider initialTheme="light">
      <AuthProvider>
        <InventoryProvider>
          <Shell />
        </InventoryProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
