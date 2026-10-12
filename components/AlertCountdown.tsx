import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, font, radius, spacing } from '../lib/theme';
import { COUNTDOWN_SECONDS } from '../lib/constants';
import { Button } from './ui/Button';

interface Props {
  visible: boolean;
  remaining: number;
  onCancel: () => void;
}

export function AlertCountdown({ visible, remaining, onCancel }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulse.value = withRepeat(
        withTiming(1.12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [visible]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const progress = Math.max(0, Math.min(1, remaining / COUNTDOWN_SECONDS));

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.heading}>Scream detected</Text>
          <Text style={styles.sub}>
            Sending an emergency alert with your location. Tap below if you're safe.
          </Text>

          <View style={styles.ringWrap}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <View style={styles.ringInner}>
              <Text style={styles.count}>{Math.max(0, remaining)}</Text>
              <Text style={styles.countLabel}>seconds</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
          </View>

          <Button
            label="I'm safe — cancel alert"
            variant="primary"
            onPress={onCancel}
            style={styles.cancelBtn}
          />
          <Text style={styles.footnote}>
            Do nothing and your emergency contacts will be alerted automatically.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const RING = 180;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,11,20,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.red,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sub: {
    fontSize: font.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 12,
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 3,
    borderColor: colors.redMid,
    backgroundColor: colors.redDim,
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  countLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  barTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
    marginBottom: 32,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  cancelBtn: {
    width: '100%',
    marginBottom: 14,
  },
  footnote: {
    fontSize: font.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
