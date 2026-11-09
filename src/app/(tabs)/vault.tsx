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
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [newPin, setNewPin] = useState('');

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

  const handleSaveNewPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }
    await setPin(newPin);
    setNewPin('');
    setShowChangePinModal(false);
    Alert.alert('PIN Updated', 'Your 4-digit vault PIN has been saved securely.');
  };

  const handleItemPress = (item: any) => {
    Haptics.selectionAsync();
    Alert.alert(
      item.filename || 'Vault Photo',
      'Choose an action for this protected photo:',
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

  const handleAddPhotoToVault = async (item: any) => {
    Haptics.selectionAsync();
    await addToVault(item);
    await deleteMediaItems([item.id]);
    setShowAddPicker(false);
    Alert.alert('Protected', 'Photo moved to Private Vault.');
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
      {/* Top Header matching docs/ui design and user spec */}
      <View style={s.header}>
        <Text style={[s.title, { color: colors.ink }]}>Private Vault</Text>

        {isUnlocked && (
          <View style={s.headerActions}>
            <Pressable
              onPress={() => setShowChangePinModal(true)}
              style={({ pressed }) => [
                s.headerBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Change PIN"
            >
              <Ionicons name="key-outline" size={18} color={colors.ink} />
            </Pressable>

            <Pressable
              onPress={lockVault}
              style={({ pressed }) => [
                s.headerBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7 },
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
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
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

          <Text style={[s.lockedTitle, { color: pinError ? '#FF3B30' : colors.ink }]}>
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
                      borderColor: pinError ? '#FF3B30' : colors.ink,
                      backgroundColor: isFilled
                        ? pinError
                          ? '#FF3B30'
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
                          { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
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
                          { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
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
                        { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
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
        </View>
      ) : (
        /* Unlocked State — Matching media_1794156067467_042c5f40.jpg */
        <ScrollView
          style={s.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
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
                  backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                  borderColor: colors.stroke,
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
                    source={{ uri: item.uri }}
                    style={s.gridThumb}
                    contentFit="cover"
                    transition={100}
                    priority="normal"
                    cachePolicy="memory-disk"
                    placeholder={isDark ? '#141416' : '#E5E5EA'}
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
                Tap "Hide Photos" above or tap "Hide" in the photo viewer to lock private photos behind PIN and fingerprint security.
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
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
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
              style={{ maxHeight: 420 }}
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                paddingBottom: 20,
              }}
            >
              {recentItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleAddPhotoToVault(item)}
                  style={({ pressed }) => [
                    s.pickerThumbWrapper,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={s.pickerThumb}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        visible={showChangePinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePinModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowChangePinModal(false)}
        >
          <View
            style={[
              s.changePinSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderRadius: radius.hero,
              },
            ]}
          >
            <Text style={[s.changePinTitle, { color: colors.ink }]}>
              Set 4-Digit Security PIN
            </Text>
            <Text style={[s.changePinSub, { color: colors.inkDim }]}>
              Enter a 4-digit code to protect your hidden photos.
            </Text>

            <View style={s.dotsRow}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={[
                    s.dot,
                    {
                      borderColor: colors.ink,
                      backgroundColor:
                        idx < newPin.length ? colors.ink : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>

            <View style={s.keypadContainer}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', 'back'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={s.keypadRow}>
                  {row.map((item, cIdx) => {
                    if (item === '') {
                      return <View key={cIdx} style={s.keypadBtnPlaceholder} />;
                    }
                    if (item === 'back') {
                      return (
                        <Pressable
                          key={item}
                          onPress={() => {
                            if (newPin.length > 0) setNewPin(newPin.slice(0, -1));
                          }}
                          style={({ pressed }) => [
                            s.keypadBtn,
                            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                            pressed && { opacity: 0.6 },
                          ]}
                        >
                          <Ionicons name="backspace-outline" size={20} color={colors.ink} />
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={item}
                        onPress={() => {
                          if (newPin.length < 4) {
                            Haptics.selectionAsync();
                            setNewPin(newPin + item);
                          }
                        }}
                        style={({ pressed }) => [
                          s.keypadBtn,
                          { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <Text style={[s.keypadText, { color: colors.ink }]}>{item}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {newPin.length === 4 && (
              <Pressable
                onPress={handleSaveNewPin}
                style={[
                  s.savePinBtn,
                  { backgroundColor: colors.ink, borderRadius: radius.pill },
                ]}
              >
                <Text style={[s.savePinText, { color: colors.bg }]}>
                  Save New PIN
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
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
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -20,
  },
  lockIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 280,
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
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scrollView: {
    flex: 1,
  },
  unlockedBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
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
    borderRadius: 20,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
    backgroundColor: '#E5E5EA',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  vaultBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  pickerThumbWrapper: {
    width: (width - 48 - 20) / 3,
    height: (width - 48 - 20) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerThumb: {
    width: '100%',
    height: '100%',
  },
  changePinSheet: {
    padding: 28,
    paddingBottom: 40,
    marginHorizontal: 20,
    alignSelf: 'center',
    width: width - 40,
    alignItems: 'center',
  },
  changePinTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  changePinSub: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  savePinBtn: {
    marginTop: 20,
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  savePinText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
