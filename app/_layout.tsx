import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AuthSessionProvider } from '../src/features/auth/data/use-session';
import { ThemeProvider } from '../src/shared/theme/theme-provider';
import { BottomNavigation } from '../src/shared/ui/bottom-navigation';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode={colorScheme === 'dark' ? 'dark' : 'light'}>
        <AuthSessionProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }} />
          <BottomNavigation />
        </AuthSessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
