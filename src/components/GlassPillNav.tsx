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
        intensity={isDark ? 65 : 85}
        tint={isDark ? 'dark' : 'light'}
        style={[
          s.capsule,
          {
            borderRadius: radius.pill,
            borderColor: colors.strokeGlass,
            ...shadow.liquidGlass,
          },
        ]}
      >
        <View style={s.innerRow}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.route || (tab.route === '/' && pathname === '/(tabs)');
            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress(tab.route)}
                style={({ pressed }) => [
                  s.tabBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
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
    borderWidth: 1,
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  tabBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
