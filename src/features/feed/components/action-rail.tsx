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
      <RailButton theme={theme} label="Поделиться" icon="↗" onPress={onShare} />
      <RailButton theme={theme} label="Позвонить" icon="☎" onPress={onCall} />
      <RailButton theme={theme} label="WhatsApp" icon="◉" onPress={onWhatsapp} brandColor={theme.colors.whatsapp} />

      <TooltipPressable
        tooltip={reviewsExpanded ? 'Скрыть отзывы и вернуть большую карточку' : 'Показать отзывы прямо в ленте'}
        onPress={onToggleReviews}
        style={[
          styles.button,
          styles.wideButton,
          {
            backgroundColor: reviewsExpanded ? 'rgba(49,91,255,0.82)' : theme.colors.glass,
            borderColor: reviewsExpanded ? 'rgba(255,255,255,0.22)' : theme.colors.glassBorder,
          },
        ]}
      >
        <Text style={[styles.icon, { color: reviewsExpanded ? '#FFFFFF' : theme.colors.text }]}>☰</Text>
        <Text style={[styles.label, { color: reviewsExpanded ? '#FFFFFF' : theme.colors.text }]}>
          {reviewsExpanded ? 'Скрыть отзывы' : 'Отзывы'}
        </Text>
      </TooltipPressable>

      <RailButton
        theme={theme}
        label={isFavorite ? 'В избранном' : 'Избранное'}
        icon={isFavorite ? '♥' : '♡'}
        onPress={onFavorite}
        brandColor={isFavorite ? theme.colors.warning : undefined}
      />
      <RailButton theme={theme} label="Описание" icon="▤" onPress={onDescription} />
    </View>
  );
}

function RailButton({
  theme,
  label,
  icon,
  brandColor,
  onPress,
}: {
  theme: AppTheme;
  label: string;
  icon: string;
  brandColor?: string;
  onPress: () => void;
}) {
  return (
    <TooltipPressable tooltip={tooltipFor(label)} onPress={onPress} style={[styles.button, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
      <Text style={[styles.icon, { color: brandColor ?? theme.colors.text }]}>{icon}</Text>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
    </TooltipPressable>
  );
}

function tooltipFor(label: string) {
  if (label === 'Поделиться') return 'Поделиться объявлением';
  if (label === 'Позвонить') return 'Позвонить по номеру объявления';
  if (label === 'WhatsApp') return 'Написать по объявлению в WhatsApp';
  if (label === 'Избранное') return 'Добавить объявление в избранное';
  if (label === 'В избранном') return 'Убрать объявление из избранного';
  if (label === 'Описание') return 'Открыть полное описание объявления';
  return label;
}

const styles = StyleSheet.create({
  rail: {
    gap: 8,
    position: 'absolute',
    right: 10,
    top: 96,
    width: 74,
    zIndex: 2,
  },
  button: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 6,
    shadowColor: '#1D2B55',
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  wideButton: {
    minHeight: 68,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
