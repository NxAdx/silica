import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';
import { useMediaStore } from '../../store/mediaStore';

export default function CollectionsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius } = useTheme();

  const featured = useMediaStore((s) => s.featuredCollections);
  const recent = useMediaStore((s) => s.recentCollections);
  const trips = useMediaStore((s) => s.tripCollections);

  const all = [...featured, ...recent, ...trips];

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
      <View style={s.header}>
        <Text style={[s.title, { color: colors.ink }]}>Collections</Text>
      </View>

      <View style={s.grid}>
        {all.map((item) => (
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
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
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
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});

