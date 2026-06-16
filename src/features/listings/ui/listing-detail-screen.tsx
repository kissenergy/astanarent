import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getFavoriteListings, getListingDetails, toggleFavorite } from '../data/listing-repository';
import { formatKztPerMonth, formatRating } from '../../../shared/lib/format';
import { useTheme } from '../../../shared/theme/theme-provider';
import { MediaCarousel } from './media-carousel';
import { ReviewComposer } from './review-composer';
import { useSession } from '../../auth/data/use-session';

export function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingDetails(id),
    enabled: Boolean(id),
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavoriteListings,
    enabled: Boolean(user),
  });

  if (isLoading) {
    return <Text style={[styles.loading, { color: theme.colors.text }]}>Загрузка...</Text>;
  }

  if (error || !data) {
    return <Text style={[styles.loading, { color: theme.colors.danger }]}>Объявление не найдено</Text>;
  }

  const mediaWidth = Math.min(width - 32, 620);
  const isFavorite = favorites.some((item) => item.id === data.id);
  const toggleListingFavorite = async () => {
    if (!user) {
      Alert.alert('Нужно войти', 'Войдите, чтобы добавлять объявления в избранное');
      router.push('/auth');
      return;
    }
    try {
      await toggleFavorite(data.id);
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (error) {
      Alert.alert('Не удалось обновить избранное', error instanceof Error ? error.message : 'Попробуйте еще раз');
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleListingFavorite}>
            <Text style={[styles.headerIcon, { color: isFavorite ? theme.colors.warning : theme.colors.text }]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </Pressable>
          <Text style={[styles.headerIcon, { color: theme.colors.text }]}>↗</Text>
        </View>
      </View>

      <MediaCarousel media={data.media ?? []} width={mediaWidth} height={300} borderRadius={24} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{data.title}</Text>
      <Text style={[styles.price, { color: theme.colors.text }]}>{formatKztPerMonth(data.priceMonth)}</Text>

      <Pressable onPress={() => Linking.openURL(`https://2gis.kz/search/${encodeURIComponent(data.addressText)}`)}>
        <Text style={[styles.address, { color: theme.colors.accent }]}>{data.addressText} · Открыть в 2ГИС</Text>
      </Pressable>

      <View style={styles.stats}>
        <Stat label="Отзывы" value={`${formatRating(data.averageRating)} ★`} />
        <Stat label="Статус" value={data.status === 'rented' ? 'Сдано' : 'Не сдано'} />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Описание</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>{data.description}</Text>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Отзывы</Text>
      <ReviewComposer listingId={data.id} />
      {(data.reviewPreviews ?? []).map((review) => (
        <View key={review.id} style={[styles.reviewRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.reviewAuthor, { color: theme.colors.text }]}>{review.userName} · {'★'.repeat(review.rating)}</Text>
          <Text style={[styles.reviewText, { color: theme.colors.textMuted }]}>{review.text}</Text>
        </View>
      ))}

      <Pressable style={[styles.contact, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => Linking.openURL(`tel:${data.listingPhone}`)}>
        <Text style={[styles.contactText, { color: theme.colors.text }]}>Телефон объявления: {data.listingPhone}</Text>
      </Pressable>
      <Pressable style={[styles.contact, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => Linking.openURL(`tel:${data.realtorPhone}`)}>
        <Text style={[styles.contactText, { color: theme.colors.text }]}>Телефон риелтора: {data.realtorPhone}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingTop: 52, paddingBottom: 112 },
  loading: { padding: 24, paddingTop: 80, fontSize: 18, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  back: { fontSize: 38, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerIcon: { fontSize: 24 },
  hero: { borderRadius: 18, height: 250, width: '100%' },
  title: { fontSize: 23, fontWeight: '900', marginTop: 16 },
  price: { fontSize: 27, fontWeight: '900', marginTop: 6 },
  address: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { borderRadius: 18, borderWidth: 1, flex: 1, padding: 12 },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginTop: 20 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  contact: { borderRadius: 18, borderWidth: 1, marginTop: 10, padding: 14 },
  contactText: { fontSize: 14, fontWeight: '800' },
  reviewRow: { borderRadius: 18, borderWidth: 1, marginTop: 8, padding: 12 },
  reviewAuthor: { fontSize: 13, fontWeight: '900' },
  reviewText: { fontSize: 13, lineHeight: 19, marginTop: 4 },
});
