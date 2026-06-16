import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMyListings, ListingDTO, updateListingStatus } from '../data/listing-repository';
import { formatKztPerMonth } from '../../../shared/lib/format';
import { useTheme } from '../../../shared/theme/theme-provider';
import { TooltipPressable } from '../../../shared/ui/tooltip-pressable';

export function MyListingsScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['my-listings'], queryFn: getMyListings });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'rented' }) => updateListingStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Мои объявления</Text>
        <TooltipPressable tooltip="Подать новое объявление" onPress={() => router.push('/add-listing')}>
          <Text style={[styles.add, { color: theme.colors.actionBlue }]}>+</Text>
        </TooltipPressable>
      </View>

      {isLoading ? <Text style={[styles.muted, { color: theme.colors.textMuted }]}>Загрузка...</Text> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>Войдите как риелтор</Text> : null}

      {data.map((item) => (
        <ListingRow
          key={item.id}
          item={item}
          onSetStatus={(status) => statusMutation.mutate({ id: item.id, status })}
        />
      ))}
    </ScrollView>
  );
}

function ListingRow({ item, onSetStatus }: { item: ListingDTO; onSetStatus: (status: 'active' | 'rented') => void }) {
  const { theme } = useTheme();
  const image = item.media?.[0]?.url;
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {image ? <Image source={{ uri: image }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: theme.colors.surfaceMuted }]} />}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.rowText, { color: theme.colors.textMuted }]}>{item.addressText}</Text>
        <Text style={[styles.rowPrice, { color: theme.colors.text }]}>{formatKztPerMonth(item.priceMonth)}</Text>
        <View style={styles.statusRow}>
          <TooltipPressable tooltip="Отметить объявление как не сданное" onPress={() => onSetStatus('active')} style={[styles.status, { backgroundColor: item.status === 'active' ? theme.colors.accentSoft : theme.colors.surfaceMuted }]}>
            <Text style={[styles.statusText, { color: theme.colors.text }]}>Не сдано</Text>
          </TooltipPressable>
          <TooltipPressable tooltip="Отметить объявление как сданное" onPress={() => onSetStatus('rented')} style={[styles.status, { backgroundColor: item.status === 'rented' ? theme.colors.accentSoft : theme.colors.surfaceMuted }]}>
            <Text style={[styles.statusText, { color: theme.colors.text }]}>Сдано</Text>
          </TooltipPressable>
        </View>
        <TooltipPressable tooltip="Редактировать текст, цену, адрес, фото и видео" onPress={() => router.push(`/edit-listing/${item.id}`)} style={[styles.editButton, { borderColor: theme.colors.border }]}>
          <Text style={[styles.editButtonText, { color: theme.colors.text }]}>Редактировать</Text>
        </TooltipPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 58,
    paddingBottom: 104,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  add: {
    fontSize: 34,
    fontWeight: '700',
  },
  muted: {
    fontSize: 14,
  },
  error: {
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#1D2B55',
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  thumb: {
    borderRadius: 16,
    height: 104,
    width: 104,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  rowText: {
    fontSize: 12,
    marginTop: 3,
  },
  rowPrice: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
