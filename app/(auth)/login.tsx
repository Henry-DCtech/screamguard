import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>◎</Text>
          </View>
          <Text style={styles.wordmark}>ScreamGuard</Text>
          <Text style={styles.tagline}>Personal safety, always on.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            secureToggle
          />

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

          <Button label="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 52,
    gap: 10,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.redMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 28,
    color: colors.red,
  },
  wordmark: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: font.base,
    color: colors.textMuted,
  },
  form: {
    gap: 2,
  },
  errorMsg: {
    fontSize: font.sm,
    color: colors.red,
    marginBottom: 6,
    marginLeft: 2,
  },
  btn: {
    marginTop: 8,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: font.sm,
    color: colors.red,
    fontWeight: '600',
  },
});
