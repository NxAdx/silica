// Silica — Collections & Folder Manager with Instant Offline Search & Tagging
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
const COLUMN_GAP = 12;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (width - 40 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function CollectionsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const [filter, setFilter] = useState<'all' | 'recent' | 'trips' | 'custom'>('all');
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
    if (selectedTag) {
      return allMediaItems.filter((i) => i.tags?.includes(selectedTag));
    }
    if (searchQuery.trim().length > 0) {
      return getFilteredItems();
    }
    return null;
  }, [selectedTag, searchQuery, allMediaItems, getFilteredItems]);

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
            paddingBottom: Math.max(insets.bottom, 20) + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and + New Album button */}
        <View style={s.header}>
          <Text style={[s.title, { color: colors.ink }]}>Collections</Text>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowCreateModal(true);
            }}
            style={({ pressed }) => [
              s.addBtn,
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
            accessibilityLabel="New Collection"
          >
            <Ionicons name="add" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* Minimal Search Bar */}
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
                      s.gridCard,
                      { borderRadius: radius.grid },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={[s.gridThumb, { borderRadius: radius.grid }]}
                      contentFit="cover"
                      transition={150}
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
            {/* Filter Pills Matching media_1794156075118_70f05f1b.png */}
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
                      {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Collections & Folders 2-Column Grid */}
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
                    source={{ uri: item.coverUri }}
                    style={[s.thumb, { borderRadius: radius.grid }]}
                    contentFit="cover"
                    transition={150}
                  />
                  <Text style={[s.name, { color: colors.ink }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.meta, { color: colors.inkDim }]}>
                    {item.count} items {item.storageSize ? `• ${item.storageSize}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Create New Album Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
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
            <Text style={[s.sheetTitle, { color: colors.ink }]}>
              New Collection
            </Text>

            <TextInput
              style={[
                s.input,
                {
                  color: colors.ink,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  borderRadius: radius.sm,
                },
              ]}
              placeholder="Collection name (e.g. Travel, Work)"
              placeholderTextColor={colors.inkDim}
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              autoFocus
            />

            <View style={s.sheetBtns}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={[
                  s.sheetBtn,
                  { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
                ]}
              >
                <Text style={{ color: colors.ink, fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCreateAlbum}
                style={[s.sheetBtn, { backgroundColor: colors.ink }]}
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
    marginTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    height: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderCurve: 'continuous',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tagChipsRow: {
    gap: 8,
    marginBottom: 16,
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
  filterRow: {
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  filterPillText: {
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    marginBottom: 8,
  },
  thumb: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E5EA',
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
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
  favBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  createSheet: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  sheetBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
