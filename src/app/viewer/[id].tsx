// Silica — Fullscreen Fluid Photo Viewer
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useMediaStore } from '../../store/mediaStore';
import { useVaultStore } from '../../store/vaultStore';
import { setAsWallpaper } from '../../services/wallpaperService';
import { useTheme } from '../../store/themeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const recentItems = useMediaStore((s) => s.recentItems);
  const toggleFavorite = useMediaStore((s) => s.toggleFavorite);
  const deleteMediaItems = useMediaStore((s) => s.deleteMediaItems);
  const addToVault = useVaultStore((s) => s.addToVault);

  // Find initial item index
  const initialIndex = recentItems.findIndex((item) => item.id === id);
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const [showInfoModal, setShowInfoModal] = useState(false);

  const currentItem = recentItems[currentIndex] || recentItems[0];

  if (!currentItem) {
    return (
      <View style={[s.container, { backgroundColor: '#000000' }]}>
        <Text style={{ color: '#FFFFFF' }}>Photo not found</Text>
      </View>
    );
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < recentItems.length - 1) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFavorite = async () => {
    await toggleFavorite(currentItem.id);
  };

  const handleSetWallpaper = async () => {
    await setAsWallpaper({ uri: currentItem.uri, filename: currentItem.filename });
  };

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(currentItem.uri);
      } else {
        Alert.alert('Sharing Unavailable', 'System sharing is not available.');
      }
    } catch (e) {
      console.warn('[Viewer] Share error:', e);
    }
  };

  const handleMoveToVault = () => {
    Alert.alert(
      'Move to Secret Vault',
      'This photo will be hidden behind biometric authentication and removed from the public gallery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide in Vault',
          style: 'destructive',
          onPress: async () => {
            await addToVault(currentItem);
            await deleteMediaItems([currentItem.id]);
            router.back();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo from Silica?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMediaItems([currentItem.id]);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <StatusBar hidden />

      {/* Top Header Bar */}
      <View
        style={[
          s.topBar,
          {
            paddingTop: Math.max(insets.top, 16),
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            s.circleBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={s.counterPill}>
          <Text style={s.counterText}>
            {currentIndex + 1} / {recentItems.length}
          </Text>
        </View>

        <Pressable
          onPress={handleFavorite}
          style={({ pressed }) => [
            s.circleBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name={currentItem.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={currentItem.isFavorite ? '#FF3B30' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      {/* Main Photo Display with Navigation Arrows */}
      <View style={s.photoContainer}>
        <Image
          source={{ uri: currentItem.uri }}
          style={s.photo}
          contentFit="contain"
          transition={200}
        />

        {/* Previous Photo Touch Target */}
        {currentIndex > 0 && (
          <Pressable
            onPress={handlePrev}
            style={s.leftArrowArea}
            accessibilityLabel="Previous photo"
          >
            <View style={s.arrowBubble}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
        )}

        {/* Next Photo Touch Target */}
        {currentIndex < recentItems.length - 1 && (
          <Pressable
            onPress={handleNext}
            style={s.rightArrowArea}
            accessibilityLabel="Next photo"
          >
            <View style={s.arrowBubble}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
        )}
      </View>

      {/* Bottom Liquid Glass Action Bar */}
      <View
        style={[
          s.bottomBarContainer,
          {
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <BlurView
          intensity={75}
          tint="dark"
          style={[s.bottomCapsule, { borderRadius: radius.pill }]}
        >
          <Pressable
            onPress={handleSetWallpaper}
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons name="image-outline" size={22} color="#FFFFFF" />
            <Text style={s.actionLabel}>Wallpaper</Text>
          </Pressable>

          <Pressable
            onPress={handleMoveToVault}
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" />
            <Text style={s.actionLabel}>Hide</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowInfoModal(true)}
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            <Text style={s.actionLabel}>Info</Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
            <Text style={s.actionLabel}>Share</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              s.actionBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons name="trash-outline" size={22} color="#FF453A" />
            <Text style={[s.actionLabel, { color: '#FF453A' }]}>Delete</Text>
          </Pressable>
        </BlurView>
      </View>

      {/* EXIF & Details Modal Sheet */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setShowInfoModal(false)}
        >
          <View
            style={[
              s.modalSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.modalHeader}>
              <Text
                style={[
                  s.modalTitle,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Photo Details
              </Text>
              <Pressable onPress={() => setShowInfoModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={isDark ? '#8E8E93' : '#AEAEB2'}
                />
              </Pressable>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoKey}>Filename</Text>
              <Text
                style={[
                  s.infoVal,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {currentItem.filename}
              </Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoKey}>Dimensions</Text>
              <Text
                style={[
                  s.infoVal,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {currentItem.width} × {currentItem.height} px
              </Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoKey}>File Size</Text>
              <Text
                style={[
                  s.infoVal,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {currentItem.formattedSize || '2.4 MB'}
              </Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoKey}>Date Taken</Text>
              <Text
                style={[
                  s.infoVal,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {new Date(currentItem.creationTime).toLocaleString()}
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 30, 32, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  counterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.78,
  },
  leftArrowArea: {
    position: 'absolute',
    left: 12,
    top: '46%',
    zIndex: 15,
  },
  rightArrowArea: {
    position: 'absolute',
    right: 12,
    top: '46%',
    zIndex: 15,
  },
  arrowBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  bottomCapsule: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(142, 142, 147, 0.2)',
  },
  infoKey: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

