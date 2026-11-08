import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Collection } from '../types';
import { useTheme } from '../store/themeStore';

interface HeroCardProps {
  collection: Collection;
}

export function HeroCard({ collection }: HeroCardProps) {
  const router = useRouter();
  const { colors, radius, shadow, isDark } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/collection/${collection.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.container,
        {
          borderRadius: radius.hero,
          ...shadow.heroCard,
        },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
      ]}
    >
      {/* Background Image */}
      <Image
        source={{ uri: collection.coverUri }}
        style={s.image}
        contentFit="cover"
        transition={250}
      />

      {/* Top Left Frosted Percentage Badge */}
      {collection.percentage && (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={[s.badge, { borderRadius: radius.pill }]}
        >
          <Text style={s.badgeText}>{collection.percentage}</Text>
        </BlurView>
      )}

      {/* Bottom Gradient Overlay */}
      <View style={s.bottomOverlay}>
        <View style={s.avatarBox}>
          <Image
            source={{ uri: collection.avatarUri || collection.coverUri }}
            style={s.avatar}
            contentFit="cover"
          />
        </View>

        <View style={s.textCol}>
          <Text style={s.dateText} numberOfLines={1}>
            {collection.dateLabel}
          </Text>
          <Text style={s.metaText}>
            {collection.count} • {collection.storageSize}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    height: 250,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
    backgroundColor: '#1E1E22',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});

