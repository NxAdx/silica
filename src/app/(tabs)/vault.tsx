// Silica — Screen 3: Biometric Secret Vault
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';
import { useVaultStore } from '../../store/vaultStore';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (width - 40 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function VaultTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const vaultItems = useVaultStore((s) => s.vaultItems);
  const authenticate = useVaultStore((s) => s.authenticate);
  const lockVault = useVaultStore((s) => s.lockVault);
  const removeFromVault = useVaultStore((s) => s.removeFromVault);

  const handleAuthenticate = async () => {
    await authenticate();
  };

  const handleItemPress = (item: any) => {
    Haptics.selectionAsync();
    Alert.alert(
      item.filename || 'Vault Photo',
      'Choose an action for this hidden photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unhide (Restore to Gallery)',
          onPress: async () => {
            await removeFromVault(item.id);
            Alert.alert('Restored', 'Photo restored to public gallery.');
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20) + 84,
        },
      ]}
    >
      <View style={s.header}>
        <Text style={[s.title, { color: colors.ink }]}>Private Vault</Text>

        {isUnlocked && (
          <Pressable
            onPress={lockVault}
            style={({ pressed }) => [
              s.lockBtn,
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Lock Vault"
          >
            <Ionicons name="lock-closed" size={18} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {!isUnlocked ? (
        <View style={s.lockedState}>
          <View
            style={[
              s.iconCircle,
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
            ]}
          >
            <Ionicons name="lock-closed" size={38} color={colors.ink} />
          </View>
          <Text style={[s.lockedTitle, { color: colors.ink }]}>
            Protected by Biometrics
          </Text>
          <Text style={[s.lockedSub, { color: colors.inkDim }]}>
            Hidden photos are isolated in local SQLite storage and will never appear in your main photo library or file managers.
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
              size={20}
              color={colors.bg}
              style={{ marginRight: 8 }}
            />
            <Text style={[s.unlockBtnText, { color: colors.bg }]}>
              Authenticate with Biometrics
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={s.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={s.unlockedBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#34C759" />
            <Text style={[s.unlockedBannerText, { color: colors.inkMid }]}>
              Vault Unlocked ({vaultItems.length} protected items)
            </Text>
          </View>

          {vaultItems.length > 0 ? (
            <View style={s.gridContainer}>
              {vaultItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={({ pressed }) => [
                    s.gridCard,
                    { borderRadius: radius.grid },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={[s.gridThumb, { borderRadius: radius.grid }]}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={s.vaultBadge}>
                    <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={s.emptyState}>
              <Ionicons
                name="images-outline"
                size={44}
                color={colors.inkDim}
                style={{ marginBottom: 12 }}
              />
              <Text style={[s.emptyTitle, { color: colors.ink }]}>
                No Hidden Photos
              </Text>
              <Text style={[s.emptySub, { color: colors.inkDim }]}>
                In any photo viewer, tap the "Hide" icon or select photos to lock them in this private vault.
              </Text>
            </View>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lockBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  unlockBtn: {
    height: 52,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  unlockedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  gridCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.35,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
    backgroundColor: '#E5E5EA',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
  },
  vaultBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
