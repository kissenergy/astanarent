import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFavoriteListings, ListingDTO } from '../data/listing-repository';
import { formatKztPerMonth } from '../../../shared/lib/format';
import { useTheme } from '../../../shared/theme/theme-provider';

export function FavoritesScreen() {
  const { theme } = useTheme();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['favorites'], queryFn: getFavoriteListings });

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Избранное</Text>
      {isLoading ? <Text style={[styles.muted, { color: theme.colors.textMuted }]}>Загрузка...</Text> : null}
      {error ? <Text style={[styles.muted, { color: theme.colors.danger }]}>Войдите, чтобы смотреть избранное</Text> : null}
      {data.map((item) => (
        <FavoriteRow key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

function FavoriteRow({ item }: { item: ListingDTO }) {
  const { theme } = useTheme();
  const image = item.media?.[0]?.url;
  return (
    <Pressable onPress={() => router.push(`/listing/${item.id}`)} style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {image ? <Image source={{ uri: image }} style={styles.thumb} /> : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.rowText, { color: theme.colors.textMuted }]}>{item.addressText}</Text>
        <Text style={[styles.rowPrice, { color: theme.colors.text }]}>{formatKztPerMonth(item.priceMonth)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingTop: 58, paddingBottom: 104 },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 16 },
  muted: { fontSize: 14, fontWeight: '700' },
  row: { borderRadius: 22, borderWidth: 1, elevation: 4, flexDirection: 'row', gap: 12, marginBottom: 12, padding: 10, shadowColor: '#1D2B55', shadowOpacity: 0.1, shadowRadius: 18 },
  thumb: { borderRadius: 16, height: 96, width: 96 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '900' },
  rowText: { fontSize: 12, marginTop: 3 },
  rowPrice: { fontSize: 16, fontWeight: '900', marginTop: 5 },
});
