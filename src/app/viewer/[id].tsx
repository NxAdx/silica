// Silica — Fullscreen Fluid Photo Viewer with Edit, Tag, Wallpaper, and Vault
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  ScrollView,
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
import {
  rotatePhoto,
  flipPhoto,
  cropPhoto,
  saveEditedPhotoToLibrary,
} from '../../services/imageEditService';
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
  const addTagToPhoto = useMediaStore((s) => s.addTagToPhoto);
  const removeTagFromPhoto = useMediaStore((s) => s.removeTagFromPhoto);
  const loadMedia = useMediaStore((s) => s.loadMedia);
  const addToVault = useVaultStore((s) => s.addToVault);

  // Initial index
  const initialIndex = recentItems.findIndex((item) => item.id === id);
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  // Edit state
  const [editedUri, setEditedUri] = useState<string | null>(null);
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);

  // Tag state
  const [newTagInput, setNewTagInput] = useState('');

  const currentItem = recentItems[currentIndex] || recentItems[0];

  if (!currentItem) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.ink }}>Photo not found</Text>
      </View>
    );
  }

  const currentTags = currentItem.tags || [];

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex - 1);
      setEditedUri(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < recentItems.length - 1) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex + 1);
      setEditedUri(null);
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
      'This photo will be hidden behind PIN/biometric authentication and removed from the public gallery.',
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

  // Image Editing Handlers
  const handleOpenEdit = () => {
    setEditedUri(currentItem.uri);
    setShowEditModal(true);
  };

  const handleRotate = async () => {
    try {
      setIsProcessingEdit(true);
      Haptics.selectionAsync();
      const baseUri = editedUri || currentItem.uri;
      const nextUri = await rotatePhoto(baseUri, 90);
      setEditedUri(nextUri);
    } catch (e) {
      console.warn('Rotate error:', e);
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const handleFlipHorizontal = async () => {
    try {
      setIsProcessingEdit(true);
      Haptics.selectionAsync();
      const baseUri = editedUri || currentItem.uri;
      const nextUri = await flipPhoto(baseUri, 'horizontal');
      setEditedUri(nextUri);
    } catch (e) {
      console.warn('Flip error:', e);
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const handleSquareCrop = async () => {
    try {
      setIsProcessingEdit(true);
      Haptics.selectionAsync();
      const baseUri = editedUri || currentItem.uri;
      const cropDim = Math.min(currentItem.width || 1000, currentItem.height || 1000);
      const nextUri = await cropPhoto(baseUri, {
        originX: 0,
        originY: 0,
        width: cropDim,
        height: cropDim,
      });
      setEditedUri(nextUri);
    } catch (e) {
      console.warn('Crop error:', e);
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const handleSaveEditCopy = async () => {
    if (!editedUri) return;
    try {
      setIsProcessingEdit(true);
      const asset = await saveEditedPhotoToLibrary(editedUri);
      if (asset) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadMedia();
        setShowEditModal(false);
        Alert.alert('Saved', 'Edited copy saved to gallery.');
      } else {
        Alert.alert('Error', 'Could not save edited image.');
      }
    } catch (e) {
      console.warn('Save edit copy error:', e);
    } finally {
      setIsProcessingEdit(false);
    }
  };

  // Tag Handlers
  const handleAddTag = async () => {
    const clean = newTagInput.trim().toLowerCase();
    if (!clean) return;
    Haptics.selectionAsync();
    await addTagToPhoto(currentItem.id, clean);
    setNewTagInput('');
  };

  const handleRemoveTag = async (tag: string) => {
    Haptics.selectionAsync();
    await removeTagFromPhoto(currentItem.id, tag);
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
          accessibilityLabel="Close"
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
          accessibilityLabel="Toggle Favorite"
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
          priority="high"
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
          intensity={80}
          tint="dark"
          style={[s.bottomCapsule, { borderRadius: radius.pill }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.bottomScrollContent}
          >
            {/* Edit */}
            <Pressable
              onPress={handleOpenEdit}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Edit</Text>
            </Pressable>

            {/* Tag */}
            <Pressable
              onPress={() => setShowTagModal(true)}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="pricetag-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Tag</Text>
            </Pressable>

            {/* Wallpaper */}
            <Pressable
              onPress={handleSetWallpaper}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="image-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Wallpaper</Text>
            </Pressable>

            {/* Hide */}
            <Pressable
              onPress={handleMoveToVault}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Hide</Text>
            </Pressable>

            {/* Info */}
            <Pressable
              onPress={() => setShowInfoModal(true)}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Info</Text>
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={s.actionLabel}>Share</Text>
            </Pressable>

            {/* Delete */}
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                s.actionBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[s.actionLabel, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </ScrollView>
        </BlurView>
      </View>

      {/* Basic Image Editing Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setShowEditModal(false)}
        >
          <View
            style={[
              s.editModalSheet,
              {
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.ink }]}>
                Photo Editor
              </Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.inkDim} />
              </Pressable>
            </View>

            {/* Live Edit Preview */}
            <View style={s.editPreviewWrapper}>
              <Image
                source={{ uri: editedUri || currentItem.uri }}
                style={s.editPreviewImage}
                contentFit="contain"
              />
            </View>

            {/* Quick Adjustment Tools */}
            <View style={s.toolsRow}>
              <Pressable
                onPress={handleRotate}
                disabled={isProcessingEdit}
                style={({ pressed }) => [
                  s.toolBtn,
                  { backgroundColor: colors.btnBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="refresh-outline" size={22} color={colors.ink} />
                <Text style={[s.toolText, { color: colors.ink }]}>Rotate 90°</Text>
              </Pressable>

              <Pressable
                onPress={handleFlipHorizontal}
                disabled={isProcessingEdit}
                style={({ pressed }) => [
                  s.toolBtn,
                  { backgroundColor: colors.btnBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="swap-horizontal-outline" size={22} color={colors.ink} />
                <Text style={[s.toolText, { color: colors.ink }]}>Flip H</Text>
              </Pressable>

              <Pressable
                onPress={handleSquareCrop}
                disabled={isProcessingEdit}
                style={({ pressed }) => [
                  s.toolBtn,
                  { backgroundColor: colors.btnBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="crop-outline" size={22} color={colors.ink} />
                <Text style={[s.toolText, { color: colors.ink }]}>Square (1:1)</Text>
              </Pressable>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSaveEditCopy}
              disabled={isProcessingEdit}
              style={({ pressed }) => [
                s.saveEditBtn,
                {
                  backgroundColor: colors.ink,
                  borderRadius: radius.pill,
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[s.saveEditText, { color: colors.bg }]}>
                {isProcessingEdit ? 'Saving...' : 'Save Copy to Gallery'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        visible={showTagModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setShowTagModal(false)}
        >
          <View
            style={[
              s.tagModalSheet,
              {
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.ink }]}>
                Photo Tags
              </Text>
              <Pressable onPress={() => setShowTagModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.inkDim} />
              </Pressable>
            </View>

            <Text style={[s.tagModalSub, { color: colors.inkDim }]}>
              Tag photos with keywords like #family, #receipt, or names for instant search.
            </Text>

            {/* Tag Input Field */}
            <View style={s.tagInputRow}>
              <TextInput
                value={newTagInput}
                onChangeText={setNewTagInput}
                placeholder="Add tag (e.g. Vacation, Receipt)..."
                placeholderTextColor={colors.inkDim}
                style={[
                  s.tagTextInput,
                  {
                    backgroundColor: colors.btnBg,
                    color: colors.ink,
                  },
                ]}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddTag}
                style={[
                  s.addTagSubmitBtn,
                  { backgroundColor: colors.ink, borderRadius: radius.sm },
                ]}
              >
                <Text style={[s.addTagSubmitText, { color: colors.bg }]}>Add</Text>
              </Pressable>
            </View>

            {/* Current Tags Chips */}
            <View style={s.tagChipsContainer}>
              {currentTags.length > 0 ? (
                currentTags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      s.tagChip,
                      {
                        backgroundColor: colors.btnBg,
                        borderColor: colors.stroke,
                      },
                    ]}
                  >
                    <Text style={[s.tagChipText, { color: colors.ink }]}>
                      #{tag}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveTag(tag)}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={14} color={colors.inkDim} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={[s.noTagsText, { color: colors.inkDim }]}>
                  No tags added yet. Type above to add your first tag.
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>

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
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.modalHeader}>
              <Text
                style={[
                  s.modalTitle,
                  { color: colors.ink },
                ]}
              >
                Photo Details
              </Text>
              <Pressable onPress={() => setShowInfoModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colors.inkDim}
                />
              </Pressable>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoKey}>Filename</Text>
              <Text
                style={[
                  s.infoVal,
                  { color: colors.ink },
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
                  { color: colors.ink },
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
                  { color: colors.ink },
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
                  { color: colors.ink },
                ]}
              >
                {new Date(currentItem.creationTime).toLocaleString()}
              </Text>
            </View>

            {/* Tags in Info Sheet */}
            {currentTags.length > 0 && (
              <View style={[s.infoRow, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                <Text style={s.infoKey}>Tags</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {currentTags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        s.tagChip,
                        {
                          backgroundColor: colors.btnBg,
                        },
                      ]}
                    >
                      <Text style={[s.tagChipText, { color: colors.ink }]}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
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
    height: 64,
    maxWidth: SCREEN_WIDTH - 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bottomScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 18,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 44,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  editModalSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  editPreviewWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPreviewImage: {
    width: '100%',
    height: '100%',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toolBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  toolText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveEditBtn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  saveEditText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagModalSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  tagModalSub: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tagTextInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderCurve: 'continuous',
    fontSize: 14,
  },
  addTagSubmitBtn: {
    paddingHorizontal: 18,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  addTagSubmitText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 40,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noTagsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
