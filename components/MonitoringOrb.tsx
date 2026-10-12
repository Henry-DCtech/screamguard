import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../lib/theme';

const ORB_SIZE = 220;

interface Props {
  active: boolean;
}

export function MonitoringOrb({ active }: Props) {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse1.value = 0;
      pulse2.value = 0;
      pulse1.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
      pulse2.value = withDelay(
        700,
        withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }),
          -1,
          false,
        ),
      );
    } else {
      pulse1.value = withTiming(0, { duration: 600 });
      pulse2.value = withTiming(0, { duration: 600 });
    }
  }, [active]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0, 0.3, 1], [0.5, 0.4, 0]),
    transform: [{ scale: interpolate(pulse1.value, [0, 1], [1, 1.55]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0, 0.3, 1], [0.35, 0.25, 0]),
    transform: [{ scale: interpolate(pulse2.value, [0, 1], [1, 1.55]) }],
  }));

  const activeColor = active ? colors.green : colors.surfaceHigh;
  const glowColor = active ? colors.greenDim : 'transparent';

  return (
    <View style={styles.container}>
      {/* Pulse rings */}
      <Animated.View
        style={[
          styles.ring,
          { backgroundColor: active ? colors.greenMid : 'transparent' },
          ring1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { backgroundColor: active ? colors.greenMid : 'transparent' },
          ring2Style,
        ]}
      />

      {/* Core */}
      <View
        style={[
          styles.core,
          {
            borderColor: activeColor,
            shadowColor: activeColor,
            shadowOpacity: active ? 0.5 : 0,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
            elevation: active ? 20 : 0,
          },
        ]}
      >
        <View style={[styles.innerGlow, { backgroundColor: glowColor }]} />

        {active ? (
          <>
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: colors.green }]} />
              <Text style={[styles.stateLabel, { color: colors.green }]}>ACTIVE</Text>
            </View>
            <Text style={styles.subtext}>Listening for screams</Text>
          </>
        ) : (
          <>
            <Text style={[styles.stateLabel, { color: colors.textMuted }]}>PAUSED</Text>
            <Text style={styles.subtext}>Monitoring off</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  core: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORB_SIZE / 2,
    opacity: 0.15,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stateLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  subtext: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
});
