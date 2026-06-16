import { StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../../../shared/theme/tokens';
import { TooltipPressable } from '../../../shared/ui/tooltip-pressable';

type ActionRailProps = {
  theme: AppTheme;
  reviewsExpanded: boolean;
  isFavorite: boolean;
  onShare: () => void;
  onCall: () => void;
  onWhatsapp: () => void;
  onToggleReviews: () => void;
  onFavorite: () => void;
  onDescription: () => void;
};

export function ActionRail({
  theme,
  reviewsExpanded,
  isFavorite,
  onShare,
  onCall,
  onWhatsapp,
  onToggleReviews,
  onFavorite,
  onDescription,
}: ActionRailProps) {
  return (
    <View style={styles.rail}>
      <RailButton label="Поделиться" icon="↗" onPress={onShare} />
      <RailButton label="Позвонить" icon="☎" onPress={onCall} />
      <RailButton label="WhatsApp" icon="◔" onPress={onWhatsapp} brandColor={theme.colors.whatsapp} />

      <TooltipPressable
        tooltip={reviewsExpanded ? 'Скрыть отзывы и вернуть большую карточку' : 'Показать отзывы прямо в ленте'}
        onPress={onToggleReviews}
        style={[
          styles.textButton,
          {
            backgroundColor: reviewsExpanded ? 'rgba(49,91,255,0.9)' : 'rgba(9,18,38,0.22)',
            borderColor: reviewsExpanded ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.28)',
          },
        ]}
      >
        <Text style={styles.textButtonIcon}>☰</Text>
        <Text style={styles.textButtonLabel}>{reviewsExpanded ? 'Скрыть' : 'Отзывы'}</Text>
      </TooltipPressable>

      <RailButton
        label={isFavorite ? 'В избранном' : 'Избранное'}
        icon={isFavorite ? '♥' : '♡'}
        onPress={onFavorite}
        brandColor={isFavorite ? theme.colors.warning : undefined}
      />
      <RailButton label="Описание" icon="▤" onPress={onDescription} />
    </View>
  );
}

function RailButton({
  label,
  icon,
  brandColor,
  onPress,
}: {
  label: string;
  icon: string;
  brandColor?: string;
  onPress: () => void;
}) {
  return (
    <TooltipPressable tooltip={tooltipFor(label)} onPress={onPress} style={styles.iconButton}>
      <View style={[styles.iconHalo, { borderColor: brandColor ?? 'rgba(255,255,255,0.38)' }]}>
        <Text style={[styles.icon, { color: brandColor ?? '#FFFFFF' }]}>{icon}</Text>
      </View>
    </TooltipPressable>
  );
}

function tooltipFor(label: string) {
  if (label === 'Поделиться') return 'Поделиться объявлением';
  if (label === 'Позвонить') return 'Позвонить по номеру объявления или риелтора';
  if (label === 'WhatsApp') return 'Написать в WhatsApp по номеру объявления или риелтора';
  if (label === 'Избранное') return 'Добавить объявление в избранное';
  if (label === 'В избранном') return 'Убрать объявление из избранного';
  if (label === 'Описание') return 'Открыть полное описание объявления';
  return label;
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: 10,
    position: 'absolute',
    right: 12,
    top: 104,
    width: 58,
    zIndex: 2,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(9,18,38,0.2)',
    borderRadius: 22,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    width: 42,
  },
  icon: {
    fontSize: 21,
    lineHeight: 24,
  },
  textButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 7,
    width: 58,
  },
  textButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
  },
  textButtonLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
});
