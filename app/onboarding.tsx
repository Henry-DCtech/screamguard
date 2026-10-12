import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, font, radius, spacing } from '../lib/theme';
import { Button } from '../components/ui/Button';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon: '◎',
    title: 'Always watching.',
    subtitle: 'ScreamGuard runs quietly in the background, listening for screams — even when your screen is off.',
    iconColor: colors.green,
    iconBg: colors.greenDim,
  },
  {
    icon: '📍',
    title: 'Location-tagged alerts.',
    subtitle: 'The moment a scream is detected, your exact location is attached to the emergency alert.',
    iconColor: colors.blue,
    iconBg: colors.blueDim,
  },
  {
    icon: '📱',
    title: 'Instant SMS alerts.',
    subtitle: 'Your emergency contacts get an SMS with your location instantly — no app required on their end.',
    iconColor: colors.red,
    iconBg: colors.redDim,
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      router.replace('/(tabs)/contacts');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Skip */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.skip}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: current.iconBg }]}>
            <Text style={[styles.iconText, { color: current.iconColor }]}>
              {current.icon}
            </Text>
          </View>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <Button
          label={isLast ? 'Add Emergency Contact' : 'Continue'}
          onPress={next}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    alignSelf: 'flex-end',
  },
  skipText: {
    fontSize: font.base,
    color: colors.textMuted,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: font.xxxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.red,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.surfaceHigh,
  },
  btn: {
    width: '100%',
  },
});
