// Silica — Screen 1: Home Discovery View (Matching docs/ui design (1).jpg)
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

  const hasPermission = useMediaStore((s) => s.hasPermission);
  const requestPermission = useMediaStore((s) => s.requestPermission);
  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const albums = useMediaStore((s) => s.albumCollections);
  const recentItems = useMediaStore((s) => s.recentItems);
  const isLoading = useMediaStore((s) => s.isLoading);
  const sortOrder = useMediaStore((s) => s.sortOrder);
  const setSortOrder = useMediaStore((s) => s.setSortOrder);

  const handleSortPress = () => {
    Haptics.selectionAsync();
    setShowSortModal(true);
  };

  // Helper to render split date: bold day+month, muted grey year
  const renderSplitDate = (dateStr: string) => {
    const match = dateStr.match(/^(\d{1,2}\s+[A-Za-z]+)\s+(\d{4})$/);
    if (match) {
      return (
        <Text style={s.recentDate} numberOfLines={1}>
          <Text style={{ color: colors.ink, fontWeight: '700' }}>{match[1]} </Text>
          <Text style={{ color: colors.inkDim, fontWeight: '400' }}>{match[2]}</Text>
        </Text>
      );
    }
    return (
      <Text style={[s.recentDate, { color: colors.ink }]} numberOfLines={1}>
        {dateStr}
      </Text>
    );
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
        {/* Header: Home + Theme Toggle + Sort Button (Matching docs/ui design (1).jpg) */}
        <View style={s.headerRow}>
          <Text style={[s.headerTitle, { color: colors.ink }]}>Home</Text>

          <View style={s.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                toggleTheme();
              }}
              style={({ pressed }) => [
                s.sortBtn,
                { backgroundColor: colors.btnBg },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Toggle Dark/Light Theme"
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={19}
                color={colors.ink}
              />
            </Pressable>

            <Pressable
              onPress={handleSortPress}
              style={({ pressed }) => [
                s.sortBtn,
                { backgroundColor: colors.btnBg },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              accessibilityLabel="Sort collections"
            >
              <Ionicons name="swap-vertical" size={19} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Permission Request Banner if permission is not yet granted */}
        {!hasPermission && (
          <View
            style={[
              s.permissionCard,
              {
                backgroundColor: colors.card,
                borderRadius: radius.hero,
                borderColor: colors.stroke,
              },
            ]}
          >
            <Ionicons
              name="images-outline"
              size={36}
              color={colors.ink}
              style={{ marginBottom: 10 }}
            />
            <Text style={[s.permissionTitle, { color: colors.ink }]}>
              Access Your Device Photos
            </Text>
            <Text style={[s.permissionSub, { color: colors.inkDim }]}>
              Silica works 100% offline with zero cloud uploads or telemetry. Grant photo permission to organize your personal gallery.
            </Text>
            <Pressable
              onPress={() => requestPermission()}
              style={({ pressed }) => [
                s.grantBtn,
                {
                  backgroundColor: colors.ink,
                  borderRadius: radius.pill,
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[s.grantBtnText, { color: colors.bg }]}>
                Grant Permission
              </Text>
            </Pressable>
          </View>
        )}

        {/* Dual Hero Cards from Real Device Photos */}
        {featured.length > 0 ? (
          <View style={s.heroRow}>
            {featured.slice(0, 2).map((col) => (
              <HeroCard key={col.id} collection={col} />
            ))}
          </View>
        ) : !isLoading && hasPermission && recentItems.length === 0 ? (
          <View
            style={[
              s.emptyHero,
              {
                backgroundColor: colors.card,
                borderRadius: radius.hero,
              },
            ]}
          >
            <Ionicons name="camera-outline" size={32} color={colors.inkDim} />
            <Text style={[s.emptyHeroTitle, { color: colors.ink }]}>
              No Photos Found
            </Text>
            <Text style={[s.emptyHeroSub, { color: colors.inkDim }]}>
              Photos and albums stored on your device will automatically show up here.
            </Text>
          </View>
        ) : null}

        {/* Recent Section (Real Date-Grouped Photos) */}
        {recent.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.ink }]}>Recent</Text>
              <Pressable
                onPress={() => router.push('/collections')}
                style={s.countRow}
                accessibilityLabel="View all recent"
              >
                <Text style={[s.countText, { color: colors.inkDim }]}>
                  {recentItems.length}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.inkDim}
                />
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
                    source={{
                      uri: item.coverUri,
                      width: 250,
                      height: 330,
                    }}
                    style={[s.recentThumb, { borderRadius: radius.grid }]}
                    contentFit="cover"
                    transition={100}
                    priority="normal"
                    cachePolicy="memory-disk"
                    recyclingKey={item.id}
                    placeholder={colors.gridPlaceholder}
                  />
                  {renderSplitDate(item.dateLabel)}
                  <Text
                    style={[s.recentMeta, { color: colors.inkDim }]}
                    numberOfLines={1}
                  >
                    {item.count} • {item.storageSize}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Trips / Albums Section (Matching docs/ui design (1).jpg) */}
        {albums.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.ink }]}>Trips</Text>
              <Pressable
                onPress={() => router.push('/collections')}
                style={s.countRow}
                accessibilityLabel="View all trips"
              >
                <Text style={[s.countText, { color: colors.inkDim }]}>
                  {albums.length}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.inkDim}
                />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalList}
            >
              {albums.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/collection/${item.id}`)}
                  style={({ pressed }) => [
                    s.recentCard,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image
                    source={{
                      uri: item.coverUri,
                      width: 250,
                      height: 330,
                    }}
                    style={[s.recentThumb, { borderRadius: radius.grid }]}
                    contentFit="cover"
                    transition={100}
                    priority="normal"
                    cachePolicy="memory-disk"
                    recyclingKey={item.id}
                    placeholder={colors.gridPlaceholder}
                  />
                  <Text
                    style={[s.recentDate, { color: colors.ink, fontWeight: '700' }]}
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
          </>
        )}
      </ScrollView>

      {/* Sort Menu Sheet */}
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
              Sort Photos & Collections
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
                Largest Size
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
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionCard: {
    marginHorizontal: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  grantBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderCurve: 'continuous',
  },
  grantBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  emptyHero: {
    marginHorizontal: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderCurve: 'continuous',
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyHeroSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 26,
  },
  recentCard: {
    width: 124,
  },
  recentThumb: {
    width: 124,
    height: 165,
    borderCurve: 'continuous',
    marginBottom: 8,
    backgroundColor: '#1E1E22',
  },
  recentDate: {
    fontSize: 13,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  recentMeta: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
