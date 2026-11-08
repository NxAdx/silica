// Silica — Screen 1: Home Discovery View
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';
import { HeroCard } from '../../components/HeroCard';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark, toggleTheme } = useTheme();

  const [showSortModal, setShowSortModal] = useState(false);

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);
  const sortOrder = useMediaStore((s) => s.sortOrder);
  const setSortOrder = useMediaStore((s) => s.setSortOrder);

  const handleSortPress = () => {
    Haptics.selectionAsync();
    setShowSortModal(true);
  };

  const handleThemeToggle = () => {
    Haptics.selectionAsync();
    toggleTheme();
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
        {/* Header: Home + Theme Toggle + Sort Button */}
        <View style={s.headerRow}>
          <Text style={[s.headerTitle, { color: colors.ink }]}>Home</Text>

          <View style={s.headerActions}>
            {/* Theme Toggle Pill */}
            <Pressable
              onPress={handleThemeToggle}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={colors.ink}
              />
            </Pressable>

            {/* Sort Button */}
            <Pressable
              onPress={handleSortPress}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Sort collections"
            >
              <Ionicons name="swap-vertical" size={19} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Dual Hero Cards (Screen 1 Visual Requirement) */}
        <View style={s.heroRow}>
          {featured.slice(0, 2).map((col) => (
            <HeroCard key={col.id} collection={col} />
          ))}
        </View>

        {/* Recent Section */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Recent</Text>
          <Pressable
            onPress={() => router.push('/collections')}
            style={s.countRow}
            accessibilityLabel="View all recent"
          >
            <Text style={[s.countText, { color: colors.inkDim }]}>146</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.inkDim} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
        >
          {recent.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/collection/${item.id}`)}
              style={({ pressed }) => [
                s.recentCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Image
                source={{ uri: item.coverUri }}
                style={[s.recentThumb, { borderRadius: radius.grid }]}
                contentFit="cover"
                transition={200}
              />
              <Text
                style={[s.recentDate, { color: colors.ink }]}
                numberOfLines={1}
              >
                {item.dateLabel}
              </Text>
              <Text
                style={[s.recentMeta, { color: colors.inkDim }]}
                numberOfLines={1}
              >
                {item.count} • {item.storageSize}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Trips Section */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Trips</Text>
          <Pressable
            onPress={() => router.push('/collections')}
            style={s.countRow}
            accessibilityLabel="View all trips"
          >
            <Text style={[s.countText, { color: colors.inkDim }]}>562</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.inkDim} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
        >
          {trips.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/collection/${item.id}`)}
              style={({ pressed }) => [
                s.recentCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Image
                source={{ uri: item.coverUri }}
                style={[s.recentThumb, { borderRadius: radius.grid }]}
                contentFit="cover"
                transition={200}
              />
              <Text
                style={[s.recentDate, { color: colors.ink }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[s.recentMeta, { color: colors.inkDim }]}
                numberOfLines={1}
              >
                {item.count} • {item.storageSize}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

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
              Sort Collections
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
                Largest Storage Size
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
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
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
  heroRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  horizontalList: {
    gap: 14,
    paddingRight: 10,
    marginBottom: 28,
  },
  recentCard: {
    width: 120,
  },
  recentThumb: {
    width: 120,
    height: 150,
    overflow: 'hidden',
    borderCurve: 'continuous',
    backgroundColor: '#E5E5EA',
    marginBottom: 8,
  },
  recentDate: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  recentMeta: {
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
