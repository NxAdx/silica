// Silica — Collections & Folder Manager (Matching docs/ui design (1).jpg & (2).jpg)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 14;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - 40 - COLUMN_GAP) / NUM_COLUMNS;

export default function CollectionsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const [filter, setFilter] = useState<'all' | 'recent' | 'trips' | 'custom'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const searchQuery = useMediaStore((s) => s.searchQuery);
  const setSearchQuery = useMediaStore((s) => s.setSearchQuery);
  const getFilteredItems = useMediaStore((s) => s.getFilteredItems);
  const allMediaItems = useMediaStore((s) => s.recentItems);
  const recentCollections = useMediaStore((s) => s.recentCollections);
  const albumCollections = useMediaStore((s) => s.albumCollections);
  const customCollections = useMediaStore((s) => s.customCollections);
  const allTags = useMediaStore((s) => s.allTags);
  const createCollection = useMediaStore((s) => s.createCollection);

  const displayedCollections = useMemo(() => {
    let list: any[] = [];
    if (filter === 'all') {
      list = [...recentCollections, ...albumCollections, ...customCollections];
    } else if (filter === 'recent') {
      list = [...recentCollections];
    } else if (filter === 'trips') {
      list = [...albumCollections];
    } else if (filter === 'custom') {
      list = [...customCollections];
    }
    return list;
  }, [filter, albumCollections, customCollections, recentCollections]);

  // Live search results
  const searchResults = useMemo(() => {
    if (!isSearchOpen && !selectedTag && searchQuery.trim().length === 0) {
      return null;
    }
    if (selectedTag) {
      return allMediaItems.filter((i) => i.tags?.includes(selectedTag));
    }
    if (searchQuery.trim().length > 0) {
      return getFilteredItems();
    }
    return null;
  }, [isSearchOpen, selectedTag, searchQuery, allMediaItems, getFilteredItems]);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert('Collection Name Required', 'Please enter a name for your collection.');
      return;
    }
    await createCollection(newAlbumName.trim());
    setNewAlbumName('');
    setShowCreateModal(false);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={s.container}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20) + 105,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Collections Title + Search Toggle + Add Collection Button */}
        <View style={s.header}>
          <Text style={[s.title, { color: colors.ink }]}>Collections</Text>

          <View style={s.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) {
                  setSearchQuery('');
                  setSelectedTag(null);
                }
              }}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Search"
            >
              <Ionicons
                name={isSearchOpen ? 'close' : 'search-outline'}
                size={19}
                color={colors.ink}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowCreateModal(true);
              }}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="New Collection"
            >
              <Ionicons name="add" size={22} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Collapsible Search Input & Tags Bar */}
        {isSearchOpen && (
          <View style={s.searchSection}>
            <View
              style={[
                s.searchBar,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                  borderRadius: radius.hero,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.inkDim}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[s.searchInput, { color: colors.ink }]}
                placeholder="Search tags, folders, dates, or names"
                placeholderTextColor={colors.inkDim}
                value={searchQuery}
                autoFocus
                onChangeText={(text) => {
                  if (selectedTag) setSelectedTag(null);
                  setSearchQuery(text);
                }}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={colors.inkDim} />
                </Pressable>
              )}
            </View>

            {/* Tag Filter Chips Bar */}
            {allTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.tagChipsRow}
              >
                {allTags.map((t) => {
                  const isSelected = selectedTag === t.name;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedTag(isSelected ? null : t.name);
                        if (!isSelected) setSearchQuery('');
                      }}
                      style={({ pressed }) => [
                        s.tagChip,
                        {
                          backgroundColor: isSelected
                            ? colors.ink
                            : isDark
                            ? '#1C1C1E'
                            : '#F2F2F7',
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          s.tagChipText,
                          {
                            color: isSelected ? colors.bg : colors.inkMid,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        #{t.name} ({t.count})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Search Results Display if Query or Tag Active */}
        {searchResults !== null ? (
          <View style={{ marginTop: 10 }}>
            <View style={s.searchResultHeader}>
              <Text style={[s.sectionTitle, { color: colors.ink }]}>
                {selectedTag ? `#${selectedTag}` : 'Search Results'}
              </Text>
              <Text style={[s.countText, { color: colors.inkDim }]}>
                {searchResults.length} photos
              </Text>
            </View>

            {searchResults.length > 0 ? (
              <View style={s.searchGrid}>
                {searchResults.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/viewer/${item.id}`)}
                    style={({ pressed }) => [
                      s.searchGridCard,
                      { borderRadius: radius.grid },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Image
                      source={{
                        uri: item.uri,
                        width: 240,
                        height: 320,
                      }}
                      style={[s.searchGridThumb, { borderRadius: radius.grid }]}
                      contentFit="cover"
                      transition={100}
                      priority="normal"
                      cachePolicy="memory-disk"
                      recyclingKey={item.id}
                      placeholder={isDark ? '#141416' : '#E5E5EA'}
                    />
                    {item.isFavorite && (
                      <View style={s.favBadge}>
                        <Ionicons name="heart" size={11} color="#FF3B30" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={s.emptySearch}>
                <Text style={{ color: colors.inkDim, fontSize: 14 }}>
                  No photos matching your search.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Filter Pills Matching Ground Truth media_1794156075118_70f05f1b.png */}
            <View style={s.filterRowWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterRow}
              >
                {(['all', 'recent', 'trips', 'custom'] as const).map((key) => {
                  const isSelected = filter === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setFilter(key);
                      }}
                      style={({ pressed }) => [
                        s.filterPill,
                        {
                          backgroundColor: isSelected
                            ? colors.ink
                            : isDark
                            ? '#1C1C1E'
                            : '#F2F2F7',
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          s.filterPillText,
                          {
                            color: isSelected ? colors.bg : colors.inkMid,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {key === 'all'
                          ? 'All'
                          : key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Collections & Folders 2-Column Grid (Matching docs/ui design (1).jpg) */}
            <View style={s.grid}>
              {displayedCollections.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/collection/${item.id}`)}
                  style={({ pressed }) => [
                    s.card,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image
                    source={{
                      uri: item.coverUri,
                      width: 360,
                      height: 360,
                    }}
                    style={[s.cardCover, { borderRadius: radius.hero }]}
                    contentFit="cover"
                    transition={120}
                    priority="normal"
                    cachePolicy="memory-disk"
                    recyclingKey={item.id}
                    placeholder={isDark ? '#141416' : '#E5E5EA'}
                  />
                  <Text
                    style={[s.cardTitle, { color: colors.ink }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[s.cardMeta, { color: colors.inkDim }]}
                    numberOfLines={1}
                  >
                    {item.count} items • {item.storageSize}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Create New Collection Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowCreateModal(false)}
        >
          <View
            style={[
              s.createSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderRadius: radius.hero,
              },
            ]}
          >
            <Text style={[s.modalTitle, { color: colors.ink }]}>
              New Collection
            </Text>
            <Text style={[s.modalSub, { color: colors.inkDim }]}>
              Create a custom album to organize your offline photos.
            </Text>

            <TextInput
              style={[
                s.modalInput,
                {
                  color: colors.ink,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  borderRadius: radius.sm,
                },
              ]}
              placeholder="e.g. Summer Vacation, Portraits, Work"
              placeholderTextColor={colors.inkDim}
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              autoFocus
            />

            <View style={s.modalBtnRow}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={[s.modalCancelBtn, { borderRadius: radius.pill }]}
              >
                <Text style={{ color: colors.inkDim, fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCreateAlbum}
                style={[
                  s.modalConfirmBtn,
                  {
                    backgroundColor: colors.ink,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={{ color: colors.bg, fontWeight: '700' }}>
                  Create
                </Text>
              </Pressable>
            </View>
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 10,
    borderCurve: 'continuous',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  tagChipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  tagChipText: {
    fontSize: 12,
  },
  filterRowWrapper: {
    marginBottom: 20,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  filterPillText: {
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  cardCover: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderCurve: 'continuous',
    marginBottom: 8,
    backgroundColor: '#1E1E22',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  searchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchGridCard: {
    width: (width - 40 - 20) / 3,
    height: ((width - 40 - 20) / 3) * 1.3,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
  },
  searchGridThumb: {
    width: '100%',
    height: '100%',
  },
  favBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 3,
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  createSheet: {
    padding: 24,
    borderCurve: 'continuous',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 20,
    borderCurve: 'continuous',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalConfirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderCurve: 'continuous',
  },
});
