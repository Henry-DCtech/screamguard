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

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { full_name, phone_number, email, password } = form;
    if (!full_name || !phone_number || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr || !data.user) {
      setError(signUpErr?.message ?? 'Registration failed.');
      setLoading(false);
      return;
    }

    // Sign in immediately so we have a valid session regardless of email confirmation
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr || !signInData.session) {
      setError('Account created but login failed. Please log in manually.');
      setLoading(false);
      router.replace('/(auth)/login');
      return;
    }

    // Insert profile and settings using the live session
    await supabase.from('profiles').insert({
      id: signInData.user.id,
      full_name,
      phone_number,
    });

    await supabase.from('device_settings').insert({ user_id: signInData.user.id });

    setLoading(false);
    router.replace('/onboarding');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your ScreamGuard profile</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full name"
            value={form.full_name}
            onChangeText={set('full_name')}
            placeholder="Ada Eze"
            autoComplete="name"
            autoCapitalize="words"
          />
          <Input
            label="Phone number"
            value={form.phone_number}
            onChangeText={set('phone_number')}
            placeholder="+234 801 234 5678"
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Minimum 6 characters"
            secureTextEntry
            secureToggle
          />

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
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
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 40,
    gap: 6,
  },
  back: {
    marginBottom: 24,
  },
  backText: {
    fontSize: font.base,
    color: colors.red,
    fontWeight: '500',
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
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
