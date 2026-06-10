import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteListingMedia,
  getListingDetails,
  ListingDTO,
  updateListing,
  uploadListingMedia,
} from '../data/listing-repository';
import { formatKzPhoneInput, normalizeKzPhone } from '../../../shared/lib/phone';
import { useTheme } from '../../../shared/theme/theme-provider';
import { TooltipPressable } from '../../../shared/ui/tooltip-pressable';

type PickedAsset = {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  durationMs?: number;
};

const maxAssets = 8;
const maxImageBytes = 12 * 1024 * 1024;
const maxVideoBytes = 80 * 1024 * 1024;
const maxVideoDurationMs = 60 * 1000;

export function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    priceMonth: '',
    addressText: '',
    description: '',
    listingPhone: '+7',
    status: 'active' as 'active' | 'rented',
  });
  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingDetails(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setForm({
      title: data.title,
      priceMonth: String(data.priceMonth),
      addressText: data.addressText,
      description: data.description,
      listingPhone: formatKzPhoneInput(data.listingPhone),
      status: data.status === 'rented' ? 'rented' : 'active',
    });
  }, [data]);

  const refreshListing = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listing', id] }),
      queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
      queryClient.invalidateQueries({ queryKey: ['feed-listings'] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedPhone = normalizeKzPhone(form.listingPhone);
      if (!normalizedPhone) {
        throw new Error('Введите корректный телефон объявления в формате +7');
      }

      const updated = await updateListing(id, {
        title: form.title,
        priceMonth: Number(form.priceMonth.replace(/\D/g, '')),
        addressText: form.addressText,
        description: form.description,
        listingPhone: normalizedPhone,
        status: form.status,
      });

      for (const asset of assets) {
        await uploadListingMedia(updated.id, asset.uri, asset.fileName, asset.mimeType);
      }

      return updated;
    },
    onSuccess: async () => {
      setAssets([]);
      setError(null);
      await refreshListing();
      router.replace('/my-listings');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось сохранить объявление'),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => deleteListingMedia(id, mediaId),
    onSuccess: refreshListing,
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось удалить файл'),
  });

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.78,
      selectionLimit: maxAssets,
    });

    if (result.canceled) {
      return;
    }

    const picked: PickedAsset[] = result.assets.map((asset, index) => ({
      uri: asset.uri,
      fileName: asset.fileName ?? `listing-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileSize: asset.fileSize,
      durationMs: asset.duration ?? undefined,
    }));

    const validAssets = picked.filter((asset) => {
      const isVideo = asset.mimeType.startsWith('video/');
      const maxSize = isVideo ? maxVideoBytes : maxImageBytes;
      if (asset.fileSize && asset.fileSize > maxSize) {
        setError(isVideo ? 'Видео должно быть не больше 80 МБ' : 'Фото должно быть не больше 12 МБ');
        return false;
      }
      if (isVideo && asset.durationMs && asset.durationMs > maxVideoDurationMs) {
        setError('Видео должно быть до 60 секунд');
        return false;
      }
      return true;
    });

    setAssets((current) => [...current, ...validAssets].slice(0, maxAssets));
  };

  if (isLoading || !data) {
    return <Text style={[styles.loading, { color: theme.colors.text }]}>Загрузка...</Text>;
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TooltipPressable tooltip="Вернуться назад" onPress={() => router.back()}>
          <Text style={[styles.close, { color: theme.colors.text }]}>×</Text>
        </TooltipPressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>Редактировать</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Текущие фото / видео</Text>
      <View style={styles.mediaGrid}>
        {(data.media ?? []).map((media) => (
          <View key={media.id} style={styles.mediaTile}>
            <Image source={{ uri: media.url }} style={styles.mediaThumb} />
            <View style={[styles.mediaBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.mediaBadgeText, { color: theme.colors.text }]}>{media.type === 'video' ? 'Видео' : 'Фото'}</Text>
            </View>
            <TooltipPressable
              tooltip="Удалить этот файл из объявления"
              onPress={() => deleteMediaMutation.mutate(media.id)}
              style={[styles.removeMedia, { backgroundColor: theme.colors.danger }]}
            >
              <Text style={styles.removeMediaText}>×</Text>
            </TooltipPressable>
          </View>
        ))}
        {assets.map((asset) => (
          <View key={asset.uri} style={styles.mediaTile}>
            <Image source={{ uri: asset.uri }} style={styles.mediaThumb} />
            <View style={[styles.mediaBadge, { backgroundColor: theme.colors.accentSoft }]}>
              <Text style={[styles.mediaBadgeText, { color: theme.colors.accentStrong }]}>Новый</Text>
            </View>
          </View>
        ))}
        <TooltipPressable tooltip="Добавить новые фото или видео" onPress={pickMedia} style={[styles.addMedia, { borderColor: theme.colors.border }]}>
          <Text style={[styles.addMediaText, { color: theme.colors.textMuted }]}>+</Text>
        </TooltipPressable>
      </View>

      <Field label="Название" value={form.title} onChangeText={(value) => setForm((current) => ({ ...current, title: value }))} />
      <Field label="Цена, ₸ / мес" value={form.priceMonth} onChangeText={(value) => setForm((current) => ({ ...current, priceMonth: value }))} keyboardType="number-pad" />
      <Field label="Адрес" value={form.addressText} onChangeText={(value) => setForm((current) => ({ ...current, addressText: value }))} />
      <Field label="Описание" value={form.description} onChangeText={(value) => setForm((current) => ({ ...current, description: value }))} multiline />
      <Field label="Телефон объявления" value={form.listingPhone} onChangeText={(value) => setForm((current) => ({ ...current, listingPhone: formatKzPhoneInput(value) }))} keyboardType="phone-pad" />

      <Text style={[styles.label, { color: theme.colors.text }]}>Статус</Text>
      <View style={styles.statusRow}>
        <TooltipPressable tooltip="Объявление активно" onPress={() => setForm((current) => ({ ...current, status: 'active' }))} style={[styles.statusButton, { backgroundColor: form.status === 'active' ? theme.colors.accentSoft : theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>Не сдано</Text>
        </TooltipPressable>
        <TooltipPressable tooltip="Квартира уже сдана" onPress={() => setForm((current) => ({ ...current, status: 'rented' }))} style={[styles.statusButton, { backgroundColor: form.status === 'rented' ? theme.colors.accentSoft : theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>Сдано</Text>
        </TooltipPressable>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <TooltipPressable tooltip="Сохранить изменения объявления" onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} style={[styles.saveButton, { backgroundColor: theme.colors.accent }]}>
        <Text style={styles.saveButtonText}>{saveMutation.isPending ? 'Сохраняем...' : 'Сохранить изменения'}</Text>
      </TooltipPressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  onChangeText: (value: string) => void;
};

function Field({ label, value, multiline, keyboardType, onChangeText }: FieldProps) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          multiline ? styles.textArea : null,
          { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 58, paddingBottom: 112 },
  loading: { padding: 24, paddingTop: 80, fontSize: 18, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  close: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '900' },
  headerSpacer: { width: 28 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 12 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaTile: { height: 92, width: 92 },
  mediaThumb: { borderRadius: 12, height: 92, width: 92 },
  mediaBadge: { borderRadius: 9, bottom: 6, left: 6, paddingHorizontal: 7, paddingVertical: 3, position: 'absolute' },
  mediaBadgeText: { fontSize: 10, fontWeight: '900' },
  removeMedia: { alignItems: 'center', borderRadius: 11, height: 22, justifyContent: 'center', position: 'absolute', right: -6, top: -6, width: 22 },
  removeMediaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  addMedia: { alignItems: 'center', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, height: 92, justifyContent: 'center', width: 92 },
  addMediaText: { fontSize: 30, fontWeight: '300' },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 50, paddingHorizontal: 13 },
  textArea: { minHeight: 104, paddingTop: 12, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 48, justifyContent: 'center' },
  statusText: { fontSize: 13, fontWeight: '900' },
  errorBox: { borderRadius: 14, borderWidth: 1, marginTop: 14, padding: 12 },
  errorText: { fontSize: 13, fontWeight: '800' },
  saveButton: { alignItems: 'center', borderRadius: 14, elevation: 4, justifyContent: 'center', marginTop: 22, minHeight: 58, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
