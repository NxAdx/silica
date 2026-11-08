import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
  const { colors, radius, isDark } = useTheme();

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);

  const handleSortPress = () => {
    Haptics.selectionAsync();
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        s.content,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20) + 72,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: Home + Sort Button */}
      <View style={s.headerRow}>
        <Text style={[s.headerTitle, { color: colors.ink }]}>Home</Text>
        <Pressable
          onPress={handleSortPress}
          style={({ pressed }) => [
            s.sortBtn,
            { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="Sort collections"
        >
          <Ionicons name="swap-vertical" size={19} color={colors.ink} />
        </Pressable>
      </View>

      {/* Dual Hero Cards */}
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
            />
            <Text style={[s.recentDate, { color: colors.ink }]}>
              {item.dateLabel}
            </Text>
            <Text style={[s.recentMeta, { color: colors.inkDim }]}>
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
            />
            <Text style={[s.recentDate, { color: colors.ink }]}>
              {item.name}
            </Text>
            <Text style={[s.recentMeta, { color: colors.inkDim }]}>
              {item.count} • {item.storageSize}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
  sortBtn: {
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
});
