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
  const { radius, shadow, isDark } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/collection/${collection.id}`);
  };

  // Split date into day+month and year (e.g. "25 Oct" and "2025")
  const renderSplitTitle = (titleStr: string) => {
    const match = titleStr.match(/^(\d{1,2}\s+[A-Za-z]+)\s+(\d{4})$/);
    if (match) {
      return (
        <Text style={s.dateText} numberOfLines={1}>
          <Text style={s.dateMain}>{match[1]} </Text>
          <Text style={s.dateYear}>{match[2]}</Text>
        </Text>
      );
    }
    return (
      <Text style={s.dateText} numberOfLines={1}>
        <Text style={s.dateMain}>{titleStr}</Text>
      </Text>
    );
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
      {/* Background Image with Downsampled Decoding */}
      <Image
        source={{
          uri: collection.coverUri,
          width: 320,
          height: 440,
        }}
        style={s.image}
        contentFit="cover"
        transition={150}
        priority="high"
        cachePolicy="memory-disk"
        placeholder={isDark ? '#141416' : '#E5E5EA'}
      />

      {/* Top Left Frosted Translucent Percentage Badge */}
      {collection.percentage && (
        <BlurView
          intensity={65}
          tint="dark"
          style={s.badge}
        >
          <Text style={s.badgeText}>{collection.percentage}</Text>
        </BlurView>
      )}

      {/* Inset Floating Frosted Glass Card (Matching Ground-Truth docs/ui design (1).jpg) */}
      <View style={s.floatingBottomCardWrapper}>
        <BlurView
          intensity={70}
          tint="dark"
          style={s.floatingBottomCard}
        >
          {/* Avatar Squircle */}
          <View style={s.avatarBox}>
            <Image
              source={{
                uri: collection.avatarUri || collection.coverUri,
                width: 100,
                height: 100,
              }}
              style={s.avatar}
              contentFit="cover"
              priority="normal"
              cachePolicy="memory-disk"
              placeholder={isDark ? '#141416' : '#E5E5EA'}
            />
          </View>

          {/* Title & Metadata Column */}
          <View style={s.textCol}>
            {renderSplitTitle(collection.name || collection.dateLabel)}
            <Text style={s.metaText}>
              {collection.count} • {collection.storageSize}
            </Text>
          </View>
        </BlurView>
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
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  floatingBottomCardWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  floatingBottomCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20, 20, 24, 0.68)',
    borderWidth: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  dateMain: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dateYear: {
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
