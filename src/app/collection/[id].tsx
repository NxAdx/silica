// Silica — Screen 2: Collection Detail View with Clean ✨ Engine
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';
import { useVaultStore } from '../../store/vaultStore';
import {
  analyzeMediaForCleanup,
  CleanerAnalysisResult,
} from '../../services/cleanerService';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (width - 40 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanerAnalysisResult | null>(null);

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);
  const custom = useMediaStore((s) => s.customCollections);
  const allMediaItems = useMediaStore((s) => s.recentItems);
  const deleteMediaItems = useMediaStore((s) => s.deleteMediaItems);
  const setSortOrder = useMediaStore((s) => s.setSortOrder);
  const sortOrder = useMediaStore((s) => s.sortOrder);
  const addToVault = useVaultStore((s) => s.addToVault);

  const collection =
    [...featured, ...recent, ...trips, ...custom].find((c) => c.id === id) ||
    featured[0];

  const handleCleanScan = () => {
    Haptics.selectionAsync();
    const result = analyzeMediaForCleanup(allMediaItems);
    setCleanResult(result);
    setShowCleanModal(true);
  };

  const handleExecuteClean = async () => {
    if (!cleanResult || cleanResult.clusters.length === 0) {
      setShowCleanModal(false);
      return;
    }
    const duplicateIdsToDelete = cleanResult.clusters.flatMap((c) =>
      c.duplicates.map((d) => d.id)
    );
    await deleteMediaItems(duplicateIdsToDelete);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCleanModal(false);
    Alert.alert(
      'Clean Complete ✨',
      `Freed ${cleanResult.formattedTotalRecoverable} by deleting ${duplicateIdsToDelete.length} redundant duplicate shots.`
    );
  };

  const toggleSelect = (itemId: string) => {
    Haptics.selectionAsync();
    const next = new Set(selectedIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Selected Photos',
      `Are you sure you want to delete ${selectedIds.size} photo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMediaItems(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectMode(false);
          },
        },
      ]
    );
  };

  const handleMoveSelectedToVault = async () => {
    if (selectedIds.size === 0) return;
    const itemsToVault = allMediaItems.filter((i) => selectedIds.has(i.id));
    for (const item of itemsToVault) {
      await addToVault(item);
    }
    await deleteMediaItems(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectMode(false);
    Alert.alert('Vault', `${itemsToVault.length} photo(s) moved to Biometric Vault.`);
  };

  const handleShareSelected = async () => {
    if (selectedIds.size === 0) return;
    const firstItem = allMediaItems.find((i) => selectedIds.has(i.id));
    if (firstItem) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(firstItem.uri);
      }
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + (isSelectMode ? 100 : 72),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header with Smooth Vignette Fade */}
        <View style={s.heroWrapper}>
          <Image
            source={{ uri: collection.coverUri }}
            style={s.heroImage}
            contentFit="cover"
          />

          {/* Vignette Gradient Overlay at Bottom */}
          <View
            style={[
              s.vignetteOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(0,0,0,0.65)'
                  : 'rgba(255,255,255,0.45)',
              },
            ]}
          />

          {/* Top navigation actions */}
          <View
            style={[
              s.topNavRow,
              { paddingTop: Math.max(insets.top, 16) },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                s.circleBtn,
                { backgroundColor: isDark ? 'rgba(30,30,32,0.85)' : '#FFFFFF' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>

            <View style={s.topRightActions}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowSortModal(true);
                }}
                style={({ pressed }) => [
                  s.circleBtn,
                  { backgroundColor: isDark ? 'rgba(30,30,32,0.85)' : '#FFFFFF' },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                ]}
                accessibilityLabel="Sort"
              >
                <Ionicons name="swap-vertical" size={18} color={colors.ink} />
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds(new Set());
                }}
                style={({ pressed }) => [
                  s.selectBtn,
                  {
                    backgroundColor: isSelectMode
                      ? colors.ink
                      : isDark
                      ? 'rgba(30,30,32,0.85)'
                      : '#FFFFFF',
                  },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text
                  style={[
                    s.selectText,
                    { color: isSelectMode ? colors.bg : colors.ink },
                  ]}
                >
                  {isSelectMode ? 'Cancel' : 'Select'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Collection Title & The Signature Clean ✨ Pill */}
        <View style={s.metaSection}>
          <Text style={[s.dateTitle, { color: colors.ink }]}>
            {collection.dateLabel}
          </Text>

          <Pressable
            onPress={handleCleanScan}
            style={({ pressed }) => [
              s.cleanPill,
              {
                borderColor: colors.stroke,
                backgroundColor: isDark ? '#1C1C1E' : '#F6F6F8',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Text style={[s.cleanText, { color: colors.ink }]}>Clean ✨</Text>
          </Pressable>
        </View>

        {/* All Images Section Header with 1.256 count */}
        <View style={s.allImagesHeader}>
          <Text style={[s.allImagesTitle, { color: colors.ink }]}>
            All Images
          </Text>
          <Text style={[s.allImagesCount, { color: colors.inkDim }]}>
            1.256
          </Text>
        </View>

        {/* 3-Column Squircle Photo Grid */}
        <View style={s.gridContainer}>
          {allMediaItems.map((item, idx) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (isSelectMode) {
                    toggleSelect(item.id);
                  } else {
                    router.push(`/viewer/${item.id}`);
                  }
                }}
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

                {/* Selection Checkmark Badge */}
                {isSelectMode && (
                  <View
                    style={[
                      s.selectionBadge,
                      isSelected && { backgroundColor: colors.ink },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.bg} />
                    )}
                  </View>
                )}

                {/* Favorite Heart Badge */}
                {item.isFavorite && !isSelectMode && (
                  <View style={s.favoriteBadge}>
                    <Ionicons name="heart" size={13} color="#FF3B30" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Select Mode Floating Bottom Batch Bar */}
      {isSelectMode && (
        <View
          style={[
            s.batchActionBar,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: colors.stroke,
              bottom: Math.max(insets.bottom, 20) + 10,
            },
          ]}
        >
          <Text style={[s.batchCountText, { color: colors.ink }]}>
            {selectedIds.size} Selected
          </Text>

          <View style={s.batchIconsRow}>
            <Pressable
              onPress={handleShareSelected}
              style={s.batchIconBtn}
              accessibilityLabel="Share selected"
            >
              <Ionicons name="share-outline" size={20} color={colors.ink} />
            </Pressable>

            <Pressable
              onPress={handleMoveSelectedToVault}
              style={s.batchIconBtn}
              accessibilityLabel="Hide selected in vault"
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.ink} />
            </Pressable>

            <Pressable
              onPress={handleDeleteSelected}
              style={s.batchIconBtn}
              accessibilityLabel="Delete selected"
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Clean ✨ Interactive Smart Cleaner Modal */}
      <Modal
        visible={showCleanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCleanModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowCleanModal(false)}
        >
          <View
            style={[
              s.cleanSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.cleanHeader}>
              <View>
                <Text style={[s.cleanTitle, { color: colors.ink }]}>
                  Smart Clean ✨
                </Text>
                <Text style={[s.cleanSub, { color: colors.inkDim }]}>
                  Scanned 1,256 photos offline
                </Text>
              </View>
              <Pressable onPress={() => setShowCleanModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={colors.inkDim}
                />
              </Pressable>
            </View>

            {cleanResult && cleanResult.clusters.length > 0 ? (
              <View style={s.cleanBody}>
                <View
                  style={[
                    s.statsBanner,
                    {
                      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text style={[s.statsNumber, { color: colors.ink }]}>
                    {cleanResult.formattedTotalRecoverable}
                  </Text>
                  <Text style={[s.statsLabel, { color: colors.inkDim }]}>
                    Recoverable from {cleanResult.totalDuplicatesCount} burst & duplicate photos
                  </Text>
                </View>

                {/* Cluster Preview Row */}
                <Text style={[s.clusterTitle, { color: colors.ink }]}>
                  Similar Shots Detected
                </Text>
                <View style={s.clusterPreviewRow}>
                  {cleanResult.clusters.slice(0, 3).map((c) => (
                    <View key={c.id} style={s.clusterCard}>
                      <Image
                        source={{ uri: c.original.uri }}
                        style={[s.clusterThumb, { borderRadius: radius.sm }]}
                      />
                      <View style={s.bestBadge}>
                        <Text style={s.bestBadgeText}>Keep Best</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* 1-Tap Clean Button */}
                <Pressable
                  onPress={handleExecuteClean}
                  style={({ pressed }) => [
                    s.executeCleanBtn,
                    {
                      backgroundColor: colors.ink,
                      borderRadius: radius.pill,
                    },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={[s.executeCleanText, { color: colors.bg }]}>
                    Clean Duplicates (Free {cleanResult.formattedTotalRecoverable})
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>
                  Your gallery is already clean!
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Sort Order Selector Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              s.sortSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderRadius: radius.hero,
              },
            ]}
          >
            <Text style={[s.sortSheetTitle, { color: colors.ink }]}>
              Sort Photos
            </Text>

            <Pressable
              onPress={() => {
                setSortOrder('date_desc');
                setShowSortModal(false);
              }}
              style={s.sortOption}
            >
              <Text
                style={[
                  s.sortOptionText,
                  {
                    color:
                      sortOrder === 'date_desc' ? colors.ink : colors.inkDim,
                    fontWeight: sortOrder === 'date_desc' ? '700' : '500',
                  },
                ]}
              >
                Newest First
              </Text>
              {sortOrder === 'date_desc' && (
                <Ionicons name="checkmark" size={18} color={colors.ink} />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setSortOrder('date_asc');
                setShowSortModal(false);
              }}
              style={s.sortOption}
            >
              <Text
                style={[
                  s.sortOptionText,
                  {
                    color:
                      sortOrder === 'date_asc' ? colors.ink : colors.inkDim,
                    fontWeight: sortOrder === 'date_asc' ? '700' : '500',
                  },
                ]}
              >
                Oldest First
              </Text>
              {sortOrder === 'date_asc' && (
                <Ionicons name="checkmark" size={18} color={colors.ink} />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setSortOrder('size_desc');
                setShowSortModal(false);
              }}
              style={s.sortOption}
            >
              <Text
                style={[
                  s.sortOptionText,
                  {
                    color:
                      sortOrder === 'size_desc' ? colors.ink : colors.inkDim,
                    fontWeight: sortOrder === 'size_desc' ? '700' : '500',
                  },
                ]}
              >
                Largest File Size
              </Text>
              {sortOrder === 'size_desc' && (
                <Ionicons name="checkmark" size={18} color={colors.ink} />
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroWrapper: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  dateTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  cleanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  cleanText: {
    fontSize: 13,
    fontWeight: '700',
  },
  allImagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  allImagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  allImagesCount: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
    paddingHorizontal: 20,
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
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchActionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  batchCountText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  batchIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  batchIconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  cleanSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
  },
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cleanTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  cleanSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cleanBody: {
    marginTop: 10,
  },
  statsBanner: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  clusterTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  clusterPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  clusterCard: {
    width: 90,
    height: 110,
    position: 'relative',
  },
  clusterThumb: {
    width: '100%',
    height: '100%',
  },
  bestBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  executeCleanBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  executeCleanText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sortSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
  },
  sortSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(142, 142, 147, 0.2)',
  },
  sortOptionText: {
    fontSize: 15,
  },
});
