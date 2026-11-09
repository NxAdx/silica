// Silica — Screen 2: Collection Detail View (Matching docs/ui design (2).jpg)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../store/themeStore';
import { useMediaStore, formatDateLabel } from '../../store/mediaStore';
import { useVaultStore } from '../../store/vaultStore';
import { Collection } from '../../types';
import {
  analyzeMediaForCleanup,
  CleanerAnalysisResult,
} from '../../services/cleanerService';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 10;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = Math.floor(width / NUM_COLUMNS - 20);
const ITEM_HEIGHT = Math.floor(ITEM_WIDTH * 1.30);

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
  const custom = useMediaStore((s) => s.customCollections);
  const albumCollections = useMediaStore((s) => s.albumCollections);
  const allMediaItems = useMediaStore((s) => s.recentItems);
  const getCollectionItems = useMediaStore((s) => s.getCollectionItems);
  const deleteMediaItems = useMediaStore((s) => s.deleteMediaItems);
  const setSortOrder = useMediaStore((s) => s.setSortOrder);
  const sortOrder = useMediaStore((s) => s.sortOrder);
  const addToVault = useVaultStore((s) => s.addToVault);

  const collectionItems = getCollectionItems(id || '');
  const displayItems = id && id !== 'all' ? collectionItems : allMediaItems;
  const loadAlbumAssets = useMediaStore((s) => s.loadAlbumAssets);

  useEffect(() => {
    if (id && id.startsWith('album-')) {
      const albumId = id.replace('album-', '');
      loadAlbumAssets(albumId);
    }
  }, [id, loadAlbumAssets]);

  let collection = [...featured, ...recent, ...custom, ...albumCollections].find(
    (c) => c.id === id || (c.albumId && `album-${c.albumId}` === id)
  );
  if (!collection && id === 'favorites') {
    collection = {
      id: 'favorites',
      name: 'Favorites',
      dateLabel: 'Favorites',
      count: displayItems.length,
      storageSize: `${Math.round(displayItems.length * 2.5)} MB`,
      coverUri: displayItems[0]?.uri || '',
      type: 'custom',
    };
  }
  const resolvedCollection: Collection = collection || {
    id: id || 'collection',
    name: displayItems[0] ? formatDateLabel(displayItems[0].creationTime) : 'Collection',
    dateLabel: displayItems[0] ? formatDateLabel(displayItems[0].creationTime) : 'Collection',
    count: displayItems.length,
    storageSize: `${Math.round(displayItems.length * 2.5)} MB`,
    coverUri: displayItems[0]?.uri || '',
    type: 'recent',
  };

  const handleCleanScan = () => {
    Haptics.selectionAsync();
    const result = analyzeMediaForCleanup(displayItems);
    setCleanResult(result);
    setShowCleanModal(true);
  };

  const handleExecuteClean = async () => {
    if (!cleanResult || cleanResult.clusters.length === 0) {
      setShowCleanModal(false);
      return;
    }
    const duplicateIds = cleanResult.clusters.flatMap((c) =>
      c.duplicates.map((d) => d.id)
    );
    await deleteMediaItems(duplicateIds);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCleanModal(false);
    Alert.alert(
      'Clean Complete',
      `Recovered ${cleanResult.formattedTotalRecoverable} of storage.`
    );
  };

  const toggleSelect = (itemId: string) => {
    Haptics.selectionAsync();
    const next = new Set(selectedIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Selected Photos',
      `Permanently delete ${selectedIds.size} photo(s)?`,
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

  // Render split date title: Bold ink day+month, muted grey year
  const renderCollectionTitle = (title: string) => {
    const match = title.match(/^(\d{1,2}\s+[A-Za-z]+)\s+(\d{4})$/);
    if (match) {
      return (
        <Text style={s.dateTitle} numberOfLines={1}>
          <Text style={{ color: colors.ink, fontWeight: '800' }}>{match[1]} </Text>
          <Text style={{ color: colors.inkDim, fontWeight: '400' }}>{match[2]}</Text>
        </Text>
      );
    }
    return (
      <Text style={[s.dateTitle, { color: colors.ink }]} numberOfLines={1}>
        {title}
      </Text>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Full Bleed Hero Image with Signature White/Black Gradient Fade Vignette */}
      <View style={[s.heroWrapper, { backgroundColor: colors.bg }]}>
        <Image
          source={{
            uri: resolvedCollection.coverUri || displayItems[0]?.uri,
            width: 600,
            height: 600,
          }}
          style={s.heroImage}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
          placeholder={isDark ? '#141416' : '#E5E5EA'}
          transition={150}
        />

        {/* Top Vignette Scrim for Status Bar */}
        <View
          style={[
            s.topScrim,
            {
              backgroundColor: isDark
                ? 'rgba(0,0,0,0.3)'
                : 'rgba(255,255,255,0.1)',
            },
          ]}
        />

        {/* Bottom Smooth Vignette Gradient Fade into Canvas Background */}
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgGradient id="heroBottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
              <Stop offset="0.45" stopColor={colors.bg} stopOpacity="0" />
              <Stop offset="0.75" stopColor={colors.bg} stopOpacity="0.55" />
              <Stop offset="0.92" stopColor={colors.bg} stopOpacity="0.9" />
              <Stop offset="1.0" stopColor={colors.bg} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBottomFade)" />
        </Svg>

        {/* Top Navigation Actions Row */}
        <View
          style={[
            s.topNavRow,
            { paddingTop: Math.max(insets.top, 16) },
          ]}
        >
          {/* Back Circular Button */}
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            style={({ pressed }) => [
              s.circleBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(30,30,34,0.85)'
                  : 'rgba(255,255,255,0.9)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.06)',
              },
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>

          {/* Right Actions: Sort + Select Pill */}
          <View style={s.topRightActions}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowSortModal(true);
              }}
              style={({ pressed }) => [
                s.circleBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(30,30,34,0.85)'
                    : 'rgba(255,255,255,0.9)',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.06)',
                },
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
                    ? 'rgba(30,30,34,0.85)'
                    : 'rgba(255,255,255,0.9)',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.06)',
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

      {/* Collection Title Row & Clean ✨ Pill Button */}
      <View style={s.metaSection}>
        {renderCollectionTitle(resolvedCollection.name || resolvedCollection.dateLabel)}

        <Pressable
          onPress={handleCleanScan}
          style={({ pressed }) => [
            s.cleanPill,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: colors.card,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Text style={[s.cleanText, { color: colors.ink }]}>Clean</Text>
          <Ionicons
            name="sparkles"
            size={13}
            color={colors.ink}
            style={{ marginLeft: 5 }}
          />
        </Pressable>
      </View>

      {/* All Images Section Header with Tabular Count */}
      <View style={s.allImagesHeader}>
        <Text style={[s.allImagesTitle, { color: colors.ink }]}>
          All Images
        </Text>
        <Text style={[s.allImagesCount, { color: colors.inkDim }]}>
          {displayItems.length.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const col = index % NUM_COLUMNS;

    return (
      <View
        style={[
          s.gridCellWrapper,
          {
            alignItems:
              col === 0 ? 'flex-start' : col === 1 ? 'center' : 'flex-end',
            paddingLeft: col === 0 ? 20 : 0,
            paddingRight: col === 2 ? 20 : 0,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            if (isSelectMode) {
              toggleSelect(item.id);
            } else {
              router.push(`/viewer/${item.id}`);
            }
          }}
          style={({ pressed }) => [
            s.gridCard,
            {
              width: ITEM_WIDTH,
              height: ITEM_HEIGHT,
              borderRadius: radius.grid,
              backgroundColor: colors.gridPlaceholder,
            },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Image
            source={{
              uri: item.uri,
              width: 240,
              height: 320,
            }}
            style={[s.gridThumb, { borderRadius: radius.grid }]}
            contentFit="cover"
            transition={100}
            priority="normal"
            cachePolicy="memory-disk"
            recyclingKey={item.id}
            placeholder={colors.gridPlaceholder}
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
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <FlashList
        data={displayItems}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        estimatedItemSize={ITEM_HEIGHT}
        drawDistance={width * 1.5}
        removeClippedSubviews={true}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + (isSelectMode ? 100 : 105),
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Select Mode Floating Bottom Batch Bar */}
      {isSelectMode && (
        <View
          style={[
            s.batchActionBar,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.stroke,
              bottom: Math.max(insets.bottom, 20) + 12,
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
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Offline Storage Cleaner Modal */}
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
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <View style={s.cleanHeader}>
              <View>
                <Text style={[s.cleanTitle, { color: colors.ink }]}>
                  Storage Clean
                </Text>
                <Text style={[s.cleanSub, { color: colors.inkDim }]}>
                  Scanned {displayItems.length} photos offline
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
                      backgroundColor: colors.btnBg,
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
                        source={{ uri: c.original.uri, width: 120, height: 120 }}
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
                    Clean Duplicate Shots
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={s.noDuplicatesBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={48}
                  color="#34C759"
                  style={{ marginBottom: 12 }}
                />
                <Text style={[s.noDuplicatesTitle, { color: colors.ink }]}>
                  Library is Perfectly Optimized
                </Text>
                <Text style={[s.noDuplicatesSub, { color: colors.inkDim }]}>
                  No duplicate or unnecessary burst photos found in this collection.
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Sort Options Modal */}
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
                backgroundColor: colors.sheetBg,
                borderRadius: radius.hero,
              },
            ]}
          >
            <Text style={[s.sortTitle, { color: colors.ink }]}>
              Sort Collection
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
  heroWrapper: {
    width: '100%',
    height: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
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
    borderWidth: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    borderWidth: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    marginTop: 18,
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 27,
    letterSpacing: -0.6,
  },
  cleanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 0.8,
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
    marginBottom: 12,
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
  gridCellWrapper: {
    flex: 1,
    marginBottom: 10,
  },
  gridCard: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
    borderCurve: 'continuous',
  },
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 3,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
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
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cleanSheet: {
    padding: 24,
    paddingBottom: 40,
    borderCurve: 'continuous',
  },
  cleanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cleanTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  cleanSub: {
    fontSize: 13,
    marginTop: 2,
  },
  cleanBody: {},
  statsBanner: {
    padding: 16,
    marginBottom: 20,
    borderCurve: 'continuous',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statsLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  clusterTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  clusterPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  clusterCard: {
    position: 'relative',
  },
  clusterThumb: {
    width: 80,
    height: 80,
    borderCurve: 'continuous',
  },
  bestBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  executeCleanBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  executeCleanText: {
    fontSize: 15,
    fontWeight: '700',
  },
  noDuplicatesBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDuplicatesTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  noDuplicatesSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sortSheet: {
    padding: 24,
    paddingBottom: 40,
    borderCurve: 'continuous',
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sortOptionText: {
    fontSize: 16,
  },
});
