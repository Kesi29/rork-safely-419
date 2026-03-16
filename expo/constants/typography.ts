import Colors from './colors';

export const fonts = {
  display: 'PlayfairDisplay_700Italic' as const,
  body: 'DMSans_400Regular' as const,
  bodyMedium: 'DMSans_500Medium' as const,
  bodySemiBold: 'DMSans_600SemiBold' as const,
  bodyBold: 'DMSans_700Bold' as const,
};

export const type = {
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  statNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 56,
    color: Colors.textPrimary,
  },
  statUnit: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  buttonPrimary: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
  },
};
