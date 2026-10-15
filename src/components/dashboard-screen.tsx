import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { radius, spacing, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ROLE_LABELS } from '@/types/user';

export interface DashboardFeature {
  title: string;
  description: string;
}

interface DashboardScreenProps {
  title: string;
  features: DashboardFeature[];
}

/** Üç panelin ortak iskeleti: karşılama, rol rozeti, özellik kartları ve çıkış butonu. */
export function DashboardScreen({ title, features }: DashboardScreenProps) {
  const colors = useThemeColors();
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            Merhaba, {profile.displayName}
            {profile.apartmentNo !== null ? ` · Daire ${profile.apartmentNo}` : ''}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryText }]}>
              {ROLE_LABELS[profile.role]}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {features.map((feature) => (
            <View
              key={feature.title}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{feature.title}</Text>
                <Text style={[styles.soon, { color: colors.textMuted }]}>Yakında</Text>
              </View>
              <Text style={{ color: colors.textMuted }}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <Button title="Çıkış yap" variant="secondary" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  soon: {
    fontSize: 12,
  },
});
