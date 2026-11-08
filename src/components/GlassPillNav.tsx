// Silica — Apple WWDC Liquid Glass Floating Navigation Capsule
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../store/themeStore';

export function GlassPillNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, radius, shadow, isDark } = useTheme();

  // Strictly only show on primary tabs: Home, Collections, Vault
  const isTabScreen =
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname === '/collections' ||
    pathname === '/(tabs)/collections' ||
    pathname === '/vault' ||
    pathname === '/(tabs)/vault';

  if (!isTabScreen) {
    return null;
  }

  const tabs = [
    { name: 'Home', route: '/', icon: 'home' as const, outlineIcon: 'home-outline' as const },
    { name: 'Collections', route: '/collections', icon: 'albums' as const, outlineIcon: 'albums-outline' as const },
    { name: 'Vault', route: '/vault', icon: 'lock-closed' as const, outlineIcon: 'lock-closed-outline' as const },
  ];

  const handlePress = (route: string) => {
    Haptics.selectionAsync();
    router.replace(route as any);
  };

  return (
    <View style={s.outerContainer} pointerEvents="box-none">
      <BlurView
        intensity={isDark ? 55 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          s.capsule,
          {
            borderRadius: radius.pill,
            backgroundColor: isDark
              ? 'rgba(20, 20, 24, 0.78)'
              : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
            ...shadow.liquidGlass,
          },
        ]}
      >
        <View style={s.innerRow}>
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.route ||
              (tab.route === '/' && pathname === '/(tabs)');

            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress(tab.route)}
                style={({ pressed }) => [
                  s.tabBtn,
                  isActive && {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.06)',
                    borderRadius: 20,
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
                ]}
                accessibilityLabel={tab.name}
              >
                <Ionicons
                  name={isActive ? tab.icon : tab.outlineIcon}
                  size={21}
                  color={isActive ? colors.ink : colors.inkDim}
                />
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  capsule: {
    height: 54,
    paddingHorizontal: 22,
    borderWidth: 0.8,
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  tabBtn: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
