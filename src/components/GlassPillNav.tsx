// Silica — Apple WWDC Liquid Glass Floating Navigation Capsule
// Reference: expo-glass-custom-menu (modules/glass-menu-android & showcase-tabs)
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../store/themeStore';

const TAB_WIDTH = 68;
const DOCK_HEIGHT = 54;
const THUMB_WIDTH = 58;
const THUMB_HEIGHT = 42;
const THUMB_PADDING_OFFSET = (TAB_WIDTH - THUMB_WIDTH) / 2;

export function GlassPillNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, colors } = useTheme();

  // Determine active index
  let activeIndex = 0;
  if (pathname.startsWith('/collection') || pathname.includes('collections')) {
    activeIndex = 1;
  } else if (pathname.includes('vault')) {
    activeIndex = 2;
  }

  const progress = useSharedValue(activeIndex);

  useEffect(() => {
    progress.value = withSpring(activeIndex, {
      damping: 24,
      stiffness: 240,
      mass: 0.8,
    });
  }, [activeIndex, progress]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: progress.value * TAB_WIDTH + THUMB_PADDING_OFFSET,
      },
    ],
  }));

  // Show on Home, Collections, Collection Detail, and Vault
  // Hook calls must always run before any return statement!
  const isVisibleScreen =
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname === '/collections' ||
    pathname === '/(tabs)/collections' ||
    pathname.startsWith('/collection') ||
    pathname === '/vault' ||
    pathname === '/(tabs)/vault';

  if (!isVisibleScreen) {
    return null;
  }

  const tabs = [
    {
      name: 'Home',
      route: '/',
      activeIcon: 'home' as const,
      inactiveIcon: 'home-outline' as const,
    },
    {
      name: 'Collections',
      route: '/collections',
      activeIcon: 'image' as const,
      inactiveIcon: 'image-outline' as const,
    },
    {
      name: 'Vault',
      route: '/vault',
      activeIcon: 'person' as const,
      inactiveIcon: 'person-outline' as const,
    },
  ];

  const handlePress = (route: string) => {
    Haptics.selectionAsync();
    router.replace(route as any);
  };

  return (
    <View style={s.outerContainer} pointerEvents="box-none">
      <BlurView
        intensity={85}
        tint={isDark ? 'dark' : 'light'}
        style={[
          s.capsule,
          {
            backgroundColor: isDark
              ? 'rgba(22, 22, 26, 0.82)'
              : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {/* Animated Sliding Squircle Thumb */}
        <Animated.View
          style={[
            s.thumb,
            {
              backgroundColor: colors.ink,
            },
            thumbAnimatedStyle,
          ]}
        />

        {/* Tab Buttons Row */}
        <View style={s.innerRow}>
          {tabs.map((tab, idx) => {
            const isActive = activeIndex === idx;

            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress(tab.route)}
                style={({ pressed }) => [
                  s.tabBtn,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
                accessibilityLabel={tab.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={21}
                  color={
                    isActive
                      ? colors.bg
                      : isDark
                      ? 'rgba(255, 255, 255, 0.55)'
                      : 'rgba(0, 0, 0, 0.5)'
                  }
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
    bottom: 26,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  capsule: {
    height: DOCK_HEIGHT,
    width: TAB_WIDTH * 3 + 12,
    borderRadius: DOCK_HEIGHT / 2,
    borderCurve: 'continuous',
    borderWidth: 0.8,
    overflow: 'hidden',
    paddingHorizontal: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 14,
  },
  thumb: {
    position: 'absolute',
    top: (DOCK_HEIGHT - THUMB_HEIGHT) / 2,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_HEIGHT / 2,
    borderCurve: 'continuous',
    zIndex: 1,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  tabBtn: {
    width: TAB_WIDTH,
    height: DOCK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
