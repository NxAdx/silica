import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../store/themeStore';
import { useMediaStore } from '../store/mediaStore';
import { GlassPillNav } from '../components/GlassPillNav';

export default function RootLayout() {
  const { isDark, colors } = useTheme();
  const initDB = useMediaStore((s) => s.initDB);
  const requestPermission = useMediaStore((s) => s.requestPermission);

  useEffect(() => {
    initDB();
    requestPermission();
  }, [initDB, requestPermission]);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="collection/[id]"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="viewer/[id]"
            options={{
              presentation: 'modal',
              animation: 'fade',
            }}
          />
        </Stack>

        {/* The Signature Persistent Floating Liquid Glass Navigation Capsule */}
        <GlassPillNav />
      </View>
    </SafeAreaProvider>
  );
}

