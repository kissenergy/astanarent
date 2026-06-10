import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo, useRef, useState } from 'react';
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../shared/theme/theme-provider';

export type ListingMediaViewItem = {
  url: string;
  type: 'photo' | 'video';
  sortOrder: number;
};

type MediaCarouselProps = {
  media: ListingMediaViewItem[];
  width: number;
  height: number;
  borderRadius?: number;
};

const fallbackImage = 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85';

export function MediaCarousel({ media, width, height, borderRadius = 24 }: MediaCarouselProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const items = useMemo(() => {
    const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.length > 0 ? sorted : [{ url: fallbackImage, type: 'photo' as const, sortOrder: 0 }];
  }, [media]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
  };

  const goTo = (direction: -1 | 1) => {
    const nextIndex = Math.max(0, Math.min(activeIndex + direction, items.length - 1));
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  return (
    <View style={[styles.frame, { height, width, borderRadius, backgroundColor: theme.colors.surfaceMuted }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => (
          <View key={`${item.url}-${index}`} style={{ height, width }}>
            {item.type === 'video' ? (
              <CarouselVideo source={item.url} />
            ) : (
              <Image source={{ uri: item.url }} style={styles.media} />
            )}
          </View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <>
          <Pressable
            accessibilityLabel="Предыдущее медиа"
            disabled={activeIndex === 0}
            onPress={() => goTo(-1)}
            style={[styles.arrow, styles.arrowLeft, activeIndex === 0 ? styles.arrowDisabled : null]}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Следующее медиа"
            disabled={activeIndex === items.length - 1}
            onPress={() => goTo(1)}
            style={[styles.arrow, styles.arrowRight, activeIndex === items.length - 1 ? styles.arrowDisabled : null]}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{activeIndex + 1}/{items.length}</Text>
          </View>
          <View style={styles.dots}>
            {items.map((item, index) => (
              <View
                key={`${item.url}-dot-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === activeIndex ? theme.colors.accent : 'rgba(255,255,255,0.62)',
                    width: index === activeIndex ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function CarouselVideo({ source }: { source: string }) {
  const player = useVideoPlayer(source, (currentPlayer) => {
    currentPlayer.loop = true;
    currentPlayer.muted = true;
  });

  return <VideoView player={player} style={styles.media} nativeControls contentFit="cover" />;
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  media: {
    height: '100%',
    width: '100%',
  },
  counter: {
    backgroundColor: 'rgba(8,12,10,0.62)',
    borderRadius: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  dots: {
    alignSelf: 'center',
    bottom: 12,
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
  },
  dot: {
    borderRadius: 999,
    height: 6,
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,12,10,0.34)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginTop: -18,
    position: 'absolute',
    top: '50%',
    width: 36,
  },
  arrowLeft: {
    left: 10,
  },
  arrowRight: {
    right: 10,
  },
  arrowDisabled: {
    opacity: 0.28,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '500',
    lineHeight: 34,
  },
});
