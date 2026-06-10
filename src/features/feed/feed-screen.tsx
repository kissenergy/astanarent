import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionRail } from './components/action-rail';
import { useTheme } from '../../shared/theme/theme-provider';
import { useFeedListings } from '../listings/data/use-feed-listings';
import { getFavoriteListings, toggleFavorite } from '../listings/data/listing-repository';
import { useSession } from '../auth/data/use-session';
import { TooltipPressable } from '../../shared/ui/tooltip-pressable';
import { MediaCarousel } from '../listings/ui/media-carousel';
import { ReviewComposer } from '../listings/ui/review-composer';

export function FeedScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const { data: listings = [], isFetching, refetch } = useFeedListings();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavoriteListings,
    enabled: Boolean(user),
  });
  const { width } = useWindowDimensions();
  const [expandedReviewsListingId, setExpandedReviewsListingId] = useState<string | null>(null);
  const cardWidth = Math.min(width - 28, 430);
  const favoriteIds = new Set(favorites.map((item) => item.id));

  const onRefresh = () => {
    void refetch();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.logoRow}>
            <View style={[styles.logoMark, { backgroundColor: theme.colors.accent }]} />
            <View>
              <Text style={[styles.brand, { color: theme.colors.text }]}>ASTANA</Text>
              <Text style={[styles.subtitle, { color: theme.colors.accent }]}>аренда квартир</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TooltipPressable tooltip="Переключить светлую и темную тему" onPress={toggleTheme} style={[styles.roundButton, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
            <Text style={{ color: theme.colors.text }}>{mode === 'light' ? '☾' : '☀'}</Text>
          </TooltipPressable>
        </View>
      </View>

      <ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        {listings.map((listing) => {
          const reviewsExpanded = expandedReviewsListingId === listing.id;

          return (
            <View key={listing.id} style={styles.feedItem}>
              <View
                style={[
                  styles.card,
                  { height: reviewsExpanded ? 360 : 640, width: cardWidth, backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.imageFill}>
                  <MediaCarousel media={listing.media} width={cardWidth} height={reviewsExpanded ? 360 : 640} borderRadius={26} />
                  <View pointerEvents="none" style={styles.imageScrim} />
                  <ActionRail
                    theme={theme}
                    reviewsExpanded={reviewsExpanded}
                    isFavorite={favoriteIds.has(listing.id)}
                    onShare={() =>
                      Share.share({
                        message: `${listing.title}\n${listing.priceLabel}\n${listing.address}`,
                      })
                    }
                    onCall={() => Linking.openURL(`tel:${listing.listingPhone}`)}
                    onWhatsapp={() =>
                      Linking.openURL(`https://wa.me/${listing.listingPhone.replace(/\D/g, '')}`)
                    }
                    onToggleReviews={() =>
                      setExpandedReviewsListingId((current) => (current === listing.id ? null : listing.id))
                    }
                    onFavorite={() =>
                      toggleFavorite(listing.id)
                        .then(() => queryClient.invalidateQueries({ queryKey: ['favorites'] }))
                        .catch((error) =>
                          Alert.alert('Нужно войти', error instanceof Error ? error.message : 'Войдите, чтобы добавить в избранное'),
                        )
                    }
                    onDescription={() => router.push(`/listing/${listing.id}`)}
                  />
                  <View style={styles.pullHint}>
                    <Text style={styles.pullHintText}>↓ Потяните вниз для обновления</Text>
                  </View>
                  <View style={styles.listingInfo}>
                    <Text style={styles.title}>{listing.title}</Text>
                    <Pressable
                      onPress={() => Linking.openURL(`https://2gis.kz/search/${encodeURIComponent(listing.address)}`)}
                    >
                      <Text style={styles.address}>{listing.address}</Text>
                    </Pressable>
                    <Text style={styles.price}>{listing.priceLabel}</Text>
                    <Text style={styles.meta}>
                      {listing.realtorName} · {listing.ratingLabel} ★ · {listing.reviewsCount} отзывов
                    </Text>
                  </View>
                </View>
              </View>

              {reviewsExpanded ? (
                <View style={[styles.reviews, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.reviewsHeader}>
                    <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>Отзывы ({listing.reviewsCount})</Text>
                    <Text style={[styles.loginHint, { color: theme.colors.textMuted }]}>Оценка видна всем, отзыв может оставить только авторизованный пользователь</Text>
                  </View>
                  <ReviewComposer listingId={listing.id} />
                  {listing.reviews.map((review) => (
                    <View key={review.id} style={[styles.reviewRow, { borderColor: theme.colors.border }]}>
                      <Text style={[styles.reviewAuthor, { color: theme.colors.text }]}>
                        {review.authorName} · {'★'.repeat(review.rating)}
                      </Text>
                      <Text style={[styles.reviewText, { color: theme.colors.textMuted }]}>{review.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      {user?.role === 'realtor' ? (
        <TooltipPressable
          tooltip="Подать новое объявление"
          onPress={() => router.push('/add-listing')}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TooltipPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 54,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  logoMark: {
    borderRadius: 8,
    height: 28,
    transform: [{ rotate: '12deg' }],
    width: 10,
  },
  roundButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,12,10,0.58)',
    borderRadius: 30,
    bottom: 86,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -29,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    width: 58,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 38,
  },
  feedItem: {
    alignItems: 'center',
    minHeight: 760,
    paddingHorizontal: 14,
  },
  card: {
    borderRadius: 26,
    elevation: 7,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  imageFill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageScrim: {
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pullHint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
    top: 14,
  },
  pullHintText: {
    color: '#334037',
    fontSize: 11,
    fontWeight: '700',
  },
  listingInfo: {
    bottom: 0,
    left: 0,
    padding: 18,
    paddingRight: 96,
    position: 'absolute',
    right: 0,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  address: {
    color: '#F4F1EA',
    fontSize: 13,
    marginTop: 5,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 14,
  },
  meta: {
    color: '#F4F1EA',
    fontSize: 13,
    marginTop: 12,
  },
  reviews: {
    borderWidth: 1,
    borderRadius: 20,
    elevation: 3,
    marginTop: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  reviewsHeader: {
    gap: 4,
    marginBottom: 8,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  loginHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewRow: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewText: {
    fontSize: 13,
    marginTop: 4,
  },
});
