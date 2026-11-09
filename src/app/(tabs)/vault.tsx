// Silica — Screen 3: Biometric & PIN Secret Vault (Matching Ground Truth Spec)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';
import { useVaultStore } from '../../store/vaultStore';
import { useMediaStore } from '../../store/mediaStore';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 40 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function VaultTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const vaultItems = useVaultStore((s) => s.vaultItems);
  const hasCustomPin = useVaultStore((s) => s.hasCustomPin);
  const checkHasPin = useVaultStore((s) => s.checkHasPin);
  const verifyPin = useVaultStore((s) => s.verifyPin);
  const setPin = useVaultStore((s) => s.setPin);
  const authenticateWithBiometrics = useVaultStore((s) => s.authenticateWithBiometrics);
  const resetPinWithDeviceAuth = useVaultStore((s) => s.resetPinWithDeviceAuth);
  const lockVault = useVaultStore((s) => s.lockVault);
  const removeFromVault = useVaultStore((s) => s.removeFromVault);
  const addToVault = useVaultStore((s) => s.addToVault);
  const deleteMediaItems = useMediaStore((s) => s.deleteMediaItems);
  const recentItems = useMediaStore((s) => s.recentItems);

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [firstEnteredPin, setFirstEnteredPin] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => {
    checkHasPin();
  }, []);

  // Handle PIN entry during setup or verification
  const handleDigitPress = async (digit: string) => {
    if (enteredPin.length >= 4) return;
    Haptics.selectionAsync();
    setPinError(false);
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);

    if (nextPin.length === 4) {
      if (!hasCustomPin) {
        // Setup flow: Create then Confirm
        if (setupStep === 'create') {
          setFirstEnteredPin(nextPin);
          setEnteredPin('');
          setSetupStep('confirm');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          // Confirm step
          if (nextPin === firstEnteredPin) {
            await setPin(nextPin);
            setEnteredPin('');
            setFirstEnteredPin('');
            setSetupStep('create');
            useVaultStore.setState({ isUnlocked: true });
            await useVaultStore.getState().loadVaultItems();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setPinError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => {
              setEnteredPin('');
              setPinError(false);
              setSetupStep('create');
              setFirstEnteredPin('');
            }, 750);
          }
        }
      } else {
        // Normal verification flow
        const ok = await verifyPin(nextPin);
        if (!ok) {
          setPinError(true);
          setTimeout(() => {
            setEnteredPin('');
            setPinError(false);
          }, 600);
        } else {
          setEnteredPin('');
          setPinError(false);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (enteredPin.length > 0) {
      Haptics.selectionAsync();
      setEnteredPin(enteredPin.slice(0, -1));
      setPinError(false);
    }
  };

  const handleBiometricPress = async () => {
    await authenticateWithBiometrics();
  };

  const handleResetPin = async () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Reset Vault PIN',
      'Authenticate with your device screen lock or fingerprint to reset your vault PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Authenticate & Reset',
          onPress: async () => {
            const ok = await resetPinWithDeviceAuth();
            if (ok) {
              setEnteredPin('');
              setFirstEnteredPin('');
              setSetupStep('create');
              Alert.alert('PIN Reset', 'Please choose a new 4-digit PIN for your vault.');
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (item: any) => {
    Haptics.selectionAsync();
    Alert.alert(
      'Vault Photo Options',
      item.filename,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unhide (Move to Gallery)',
          onPress: async () => {
            await removeFromVault(item.id);
            Alert.alert('Restored', 'Photo restored to normal gallery.');
          },
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await removeFromVault(item.id);
            await deleteMediaItems([item.id]);
          },
        },
      ]
    );
  };

  const handlePickToHide = async (item: any) => {
    await addToVault(item);
    await deleteMediaItems([item.id]);
    setShowAddPicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Top Header matching media_1794156067467_042c5f40.jpg */}
      <View
        style={[
          s.header,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
      >
        <Text style={[s.title, { color: colors.ink }]}>Private Vault</Text>

        {isUnlocked && (
          <View style={s.headerActions}>
            <Pressable
              onPress={handleResetPin}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: colors.btnBg },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Reset PIN"
            >
              <Ionicons name="key-outline" size={18} color={colors.ink} />
            </Pressable>

            <Pressable
              onPress={() => lockVault()}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: colors.btnBg },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Lock Vault"
            >
              <Ionicons name="lock-closed" size={18} color={colors.ink} />
            </Pressable>
          </View>
        )}
      </View>

      {!isUnlocked ? (
        /* PIN Entry / Onboarding Screen */
        <View style={s.lockedContainer}>
          <View
            style={[
              s.lockIconWrapper,
              { backgroundColor: colors.btnBg },
            ]}
          >
            <Ionicons
              name={
                !hasCustomPin
                  ? setupStep === 'create'
                    ? 'shield-outline'
                    : 'shield-checkmark-outline'
                  : 'shield-checkmark'
              }
              size={32}
              color={colors.ink}
            />
          </View>

          <Text style={[s.lockedTitle, { color: pinError ? colors.danger : colors.ink }]}>
            {!hasCustomPin
              ? setupStep === 'create'
                ? 'Create Security PIN'
                : 'Confirm Security PIN'
              : pinError
              ? 'Incorrect PIN'
              : 'Enter 4-Digit PIN'}
          </Text>

          <Text style={[s.lockedSub, { color: colors.inkDim }]}>
            {!hasCustomPin
              ? setupStep === 'create'
                ? 'Choose a 4-digit PIN to secure your hidden photos'
                : pinError
                ? 'PINs did not match. Please try again.'
                : 'Re-enter your 4-digit PIN to confirm'
              : 'Enter your 4-digit PIN or authenticate with biometrics'}
          </Text>

          {/* 4 Dots PIN Display */}
          <View style={s.dotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < enteredPin.length;
              return (
                <View
                  key={idx}
                  style={[
                    s.dot,
                    {
                      borderColor: pinError ? colors.danger : colors.ink,
                      backgroundColor: isFilled
                        ? pinError
                          ? colors.danger
                          : colors.ink
                        : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Minimal Keypad */}
          <View style={s.keypadContainer}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              [hasCustomPin ? 'bio' : '', '0', 'back'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={s.keypadRow}>
                {row.map((item, cIdx) => {
                  if (item === '') {
                    return <View key={cIdx} style={s.keypadBtnPlaceholder} />;
                  }
                  if (item === 'bio') {
                    return (
                      <Pressable
                        key={item}
                        onPress={handleBiometricPress}
                        style={({ pressed }) => [
                          s.keypadBtn,
                          { backgroundColor: colors.btnBg },
                          pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                        ]}
                        accessibilityLabel="Unlock with Fingerprint"
                      >
                        <Ionicons name="finger-print" size={26} color={colors.ink} />
                      </Pressable>
                    );
                  }
                  if (item === 'back') {
                    return (
                      <Pressable
                        key={item}
                        onPress={handleBackspace}
                        style={({ pressed }) => [
                          s.keypadBtn,
                          { backgroundColor: colors.btnBg },
                          pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                        ]}
                        accessibilityLabel="Backspace"
                      >
                        <Ionicons name="backspace-outline" size={22} color={colors.ink} />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={item}
                      onPress={() => handleDigitPress(item)}
                      style={({ pressed }) => [
                        s.keypadBtn,
                        { backgroundColor: colors.btnBg },
                        pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                      ]}
                    >
                      <Text style={[s.keypadText, { color: colors.ink }]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Reset PIN Option for easy recovery */}
          {hasCustomPin && (
            <Pressable
              onPress={handleResetPin}
              style={s.forgotBtn}
            >
              <Text style={[s.forgotBtnText, { color: colors.inkDim }]}>
                Forgot PIN? Reset with Screen Lock
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* Unlocked State — Matching docs/ui design (2).jpg */
        <ScrollView
          style={s.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 115 }}
        >
          {/* Status Row with Checkmark Banner and + Hide Photos Pill */}
          <View style={s.unlockedBannerRow}>
            <View style={s.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={17} color="#34C759" />
              <Text style={[s.unlockedBannerText, { color: colors.inkMid }]}>
                Vault Unlocked ({vaultItems.length} protected item{vaultItems.length === 1 ? '' : 's'})
              </Text>
            </View>

            <Pressable
              onPress={() => setShowAddPicker(true)}
              style={({ pressed }) => [
                s.addPhotosBtn,
                {
                  backgroundColor: colors.btnBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.ink} />
              <Text style={[s.addPhotosBtnText, { color: colors.ink }]}>Hide Photos</Text>
            </Pressable>
          </View>

          {/* 2-Column Photo Grid matching media_1794156067467_042c5f40.jpg */}
          {vaultItems.length > 0 ? (
            <View style={s.gridContainer}>
              {vaultItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={({ pressed }) => [
                    s.gridCard,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image
                    source={{
                      uri: item.uri,
                      width: 320,
                      height: 380,
                    }}
                    style={s.gridThumb}
                    contentFit="cover"
                    transition={100}
                    priority="normal"
                    cachePolicy="memory-disk"
                    placeholder={colors.gridPlaceholder}
                  />
                  {/* Lock Badge in Upper Right Corner */}
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
                size={48}
                color={colors.inkDim}
                style={{ marginBottom: 12 }}
              />
              <Text style={[s.emptyTitle, { color: colors.ink }]}>
                No Hidden Photos
              </Text>
              <Text style={[s.emptySub, { color: colors.inkDim }]}>
                Tap “Hide Photos” above or tap “Hide” in the photo viewer to lock private photos behind PIN and fingerprint security.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Hide Photos Modal Picker */}
      <Modal
        visible={showAddPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPicker(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowAddPicker(false)}
        >
          <View
            style={[
              s.pickerSheet,
              {
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.pickerHeader}>
              <Text style={[s.pickerTitle, { color: colors.ink }]}>
                Select Photo to Hide
              </Text>
              <Pressable onPress={() => setShowAddPicker(false)}>
                <Ionicons name="close-circle" size={26} color={colors.inkDim} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={s.pickerGrid}
              showsVerticalScrollIndicator={false}
            >
              {recentItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handlePickToHide(item)}
                  style={s.pickerCard}
                >
                  <Image
                    source={{
                      uri: item.uri,
                      width: 200,
                      height: 200,
                    }}
                    style={s.pickerThumb}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  lockIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 36,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  keypadContainer: {
    width: 260,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnPlaceholder: {
    width: 68,
    height: 68,
  },
  keypadText: {
    fontSize: 24,
    fontWeight: '600',
  },
  forgotBtn: {
    marginTop: 24,
    padding: 8,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  unlockedBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 0.8,
  },
  addPhotosBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  gridCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.3,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E22',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  vaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    maxHeight: '75%',
    padding: 24,
    borderCurve: 'continuous',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  pickerCard: {
    width: (width - 48 - 16) / 3,
    height: (width - 48 - 16) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerThumb: {
    width: '100%',
    height: '100%',
  },
});
