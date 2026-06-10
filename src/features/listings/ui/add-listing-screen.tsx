import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createListing, uploadListingMedia } from '../data/listing-repository';
import { formatKzPhoneInput, normalizeKzPhone } from '../../../shared/lib/phone';
import { useTheme } from '../../../shared/theme/theme-provider';
import { useSession } from '../../auth/data/use-session';
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

export function AddListingScreen() {
  const { theme } = useTheme();
  const { user, loading: sessionLoading } = useSession();
  const [title, setTitle] = useState('');
  const [priceMonth, setPriceMonth] = useState('');
  const [addressText, setAddressText] = useState('');
  const [description, setDescription] = useState('');
  const [listingPhone, setListingPhone] = useState('+7');
  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'realtor') {
      router.replace('/auth?intent=listing');
    }
  }, [sessionLoading, user]);

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

  const publish = async () => {
    try {
      setLoading(true);
      setError(null);

      const normalizedListingPhone = normalizeKzPhone(listingPhone);
      if (!user?.phone || !normalizedListingPhone) {
        throw new Error('Введите корректный телефон объявления в формате +7');
      }
      if (assets.length === 0) {
        throw new Error('Добавьте хотя бы одно фото или видео');
      }

      const listing = await createListing({
        title,
        priceMonth: Number(priceMonth.replace(/\D/g, '')),
        addressText,
        description,
        realtorPhone: user.phone,
        listingPhone: normalizedListingPhone,
      });

      for (const asset of assets) {
        await uploadListingMedia(listing.id, asset.uri, asset.fileName, asset.mimeType);
      }

      router.replace('/my-listings');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось опубликовать объявление';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || user?.role !== 'realtor') {
    return null;
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TooltipPressable tooltip="Вернуться назад" onPress={() => router.back()}>
          <Text style={[styles.close, { color: theme.colors.text }]}>×</Text>
        </TooltipPressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>Добавить объявление</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View pointerEvents="none" style={styles.wallpaper}>
        <View style={[styles.wallpaperLine, { backgroundColor: theme.colors.accentSoft }]} />
        <View style={[styles.wallpaperLine, styles.wallpaperLineTwo, { backgroundColor: theme.colors.accentSoft }]} />
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Фото / Видео</Text>
      <Text style={[styles.mediaHint, { color: theme.colors.textMuted }]}>До 8 файлов. Фото до 12 МБ, видео до 60 сек и 80 МБ.</Text>
      <View style={styles.mediaGrid}>
        {assets.map((asset) => (
          <Image key={asset.uri} source={{ uri: asset.uri }} style={styles.mediaThumb} />
        ))}
        <TooltipPressable tooltip="Добавить фото или видео объявления" onPress={pickMedia} style={[styles.addMedia, { borderColor: theme.colors.border }]}>
          <Text style={[styles.addMediaText, { color: theme.colors.textMuted }]}>+</Text>
        </TooltipPressable>
      </View>

      <Field label="Название объявления" value={title} onChangeText={setTitle} placeholder="Например: 2-комн. квартира в Highvill" />
      <Field label="Цена, ₸ / мес" value={priceMonth} onChangeText={setPriceMonth} keyboardType="number-pad" placeholder="Например: 280000" />
      <Field label="Адрес" value={addressText} onChangeText={setAddressText} placeholder="Например: ул. Керей Жанибек, 12/1" />
      <Field label="Описание" value={description} onChangeText={setDescription} placeholder="Ремонт, мебель, техника, инфраструктура..." multiline />
      <Text style={[styles.note, { color: theme.colors.textMuted }]}>Телефон риелтора берется из профиля: {user.phone}</Text>
      <Field label="Телефон объявления" value={listingPhone} onChangeText={(value) => setListingPhone(formatKzPhoneInput(value))} keyboardType="phone-pad" />

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <TooltipPressable tooltip="Опубликовать объявление" onPress={publish} disabled={loading} style={[styles.publishButton, { backgroundColor: theme.colors.accent }]}>
        <Text style={styles.publishButtonText}>{loading ? 'Публикуем...' : 'Опубликовать объявление'}</Text>
      </TooltipPressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  onChangeText: (value: string) => void;
};

function Field({ label, value, placeholder, multiline, keyboardType, onChangeText }: FieldProps) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
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
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingTop: 58,
    paddingBottom: 112,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  close: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 28,
  },
  wallpaper: {
    height: 0,
    position: 'relative',
    zIndex: -1,
  },
  wallpaperLine: {
    borderRadius: 999,
    height: 180,
    opacity: 0.42,
    position: 'absolute',
    right: -80,
    top: 54,
    transform: [{ rotate: '-18deg' }],
    width: 280,
  },
  wallpaperLineTwo: {
    left: -130,
    opacity: 0.26,
    top: 420,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaHint: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  mediaThumb: {
    borderRadius: 12,
    height: 82,
    width: 82,
  },
  addMedia: {
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  addMediaText: {
    fontSize: 30,
    fontWeight: '300',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 13,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  publishButton: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 4,
    marginTop: 22,
    minHeight: 58,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
