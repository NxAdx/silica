// Silica — Collections Tab Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';

export default function CollectionsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const [filter, setFilter] = useState<'all' | 'recent' | 'trips' | 'custom'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);
  const custom = useMediaStore((s) => s.customCollections);
  const createCollection = useMediaStore((s) => s.createCollection);

  const allCollections = [...featured, ...recent, ...trips, ...custom];

  const filteredCollections = allCollections.filter((c) => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert('Album Name Required', 'Please enter a name for your new collection.');
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
            paddingBottom: Math.max(insets.bottom, 20) + 84,
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

        {/* Filter Pills */}
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
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Collections 2-Column Grid */}
        <View style={s.grid}>
          {filteredCollections.map((item) => (
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
                transition={200}
              />
              <Text style={[s.name, { color: colors.ink }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[s.meta, { color: colors.inkDim }]}>
                {item.count} items • {item.storageSize}
              </Text>
            </Pressable>
          ))}
        </View>
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
              placeholder="Collection Name (e.g. Kyoto Trip)"
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
