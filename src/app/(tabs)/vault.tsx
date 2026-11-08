import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';

export default function VaultTab() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleAuthenticate = async () => {
    Haptics.selectionAsync();
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Silica Secret Vault',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsUnlocked(true);
      }
    } catch (e) {
      console.warn('[Vault] Auth error:', e);
    }
  };

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20) + 72,
        },
      ]}
    >
      <View style={s.header}>
        <Text style={[s.title, { color: colors.ink }]}>Private Vault</Text>
      </View>

      {!isUnlocked ? (
        <View style={s.lockedState}>
          <View
            style={[
              s.iconCircle,
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
            ]}
          >
            <Ionicons name="lock-closed" size={36} color={colors.ink} />
          </View>
          <Text style={[s.lockedTitle, { color: colors.ink }]}>
            Protected by Biometrics
          </Text>
          <Text style={[s.lockedSub, { color: colors.inkDim }]}>
            Hidden photos are encrypted and never visible in your general gallery.
          </Text>

          <Pressable
            onPress={handleAuthenticate}
            style={({ pressed }) => [
              s.unlockBtn,
              {
                backgroundColor: colors.ink,
                borderRadius: radius.pill,
              },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons
              name="finger-print"
              size={18}
              color={colors.bg}
              style={{ marginRight: 8 }}
            />
            <Text style={[s.unlockBtnText, { color: colors.bg }]}>
              Authenticate
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.unlockedState}>
          <Text style={[s.emptyText, { color: colors.inkDim }]}>
            Your vault is empty. Long press any photo to hide it here.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lockedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  lockedSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 24,
    borderCurve: 'continuous',
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  unlockedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

