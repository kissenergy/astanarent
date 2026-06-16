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
      <IconAction
        tooltip={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        icon={isFavorite ? '♥' : '♡'}
        onPress={onFavorite}
        activeColor={isFavorite ? theme.colors.warning : undefined}
        count={isFavorite ? 'в избранном' : undefined}
      />
      <IconAction
        tooltip={reviewsExpanded ? 'Скрыть отзывы' : 'Показать отзывы'}
        icon="●●●"
        onPress={onToggleReviews}
        activeColor={reviewsExpanded ? theme.colors.actionBlue : undefined}
        count={reviewsExpanded ? 'скрыть' : 'отзывы'}
      />
      <IconAction tooltip="Позвонить" icon="☎" onPress={onCall} />
      <IconAction tooltip="Написать в WhatsApp" icon="◔" onPress={onWhatsapp} activeColor={theme.colors.whatsapp} />
      <IconAction tooltip="Поделиться" icon="↗" onPress={onShare} />
      <IconAction tooltip="Описание" icon="▤" onPress={onDescription} />
    </View>
  );
}

function IconAction({
  tooltip,
  icon,
  count,
  activeColor,
  onPress,
}: {
  tooltip: string;
  icon: string;
  count?: string;
  activeColor?: string;
  onPress: () => void;
}) {
  return (
    <TooltipPressable tooltip={tooltip} onPress={onPress} style={styles.action}>
      <Text style={[styles.icon, { color: activeColor ?? '#FFFFFF' }]}>{icon}</Text>
      {count ? <Text style={styles.count}>{count}</Text> : null}
    </TooltipPressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    right: 12,
    top: 78,
    width: 54,
    zIndex: 2,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    width: 54,
  },
  icon: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  count: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
