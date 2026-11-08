import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';

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

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);

  const collection =
    [...featured, ...recent, ...trips].find((c) => c.id === id) || featured[0];

  // Dummy 9 gallery photos matching the aesthetic in the attached screenshot
  const galleryItems = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80',
  ];

  const handleClean = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    alert('Silica Clean Engine: Scanned 1,256 photos. Zero duplicates found.');
  };

  const toggleSelect = (imgId: string) => {
    Haptics.selectionAsync();
    const next = new Set(selectedIds);
    if (next.has(imgId)) next.delete(imgId);
    else next.add(imgId);
    setSelectedIds(next);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 72,
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
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>

            <View style={s.topRightActions}>
              <Pressable
                onPress={() => Haptics.selectionAsync()}
                style={({ pressed }) => [
                  s.circleBtn,
                  { backgroundColor: isDark ? 'rgba(30,30,32,0.85)' : '#FFFFFF' },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Sort"
              >
                <Ionicons name="swap-vertical" size={18} color={colors.ink} />
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsSelectMode(!isSelectMode);
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
                  pressed && { opacity: 0.8 },
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
            onPress={handleClean}
            style={({ pressed }) => [
              s.cleanPill,
              {
                borderColor: colors.stroke,
                backgroundColor: isDark ? '#1C1C1E' : '#F6F6F8',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
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
          {galleryItems.map((uri, idx) => {
            const isSelected = selectedIds.has(idx.toString());
            return (
              <Pressable
                key={idx}
                onPress={() => {
                  if (isSelectMode) toggleSelect(idx.toString());
                  else router.push(`/viewer/${idx}`);
                }}
                style={({ pressed }) => [
                  s.gridCard,
                  { borderRadius: radius.grid },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Image
                  source={{ uri }}
                  style={[s.gridThumb, { borderRadius: radius.grid }]}
                  contentFit="cover"
                />
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
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
});
