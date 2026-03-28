import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FormInput, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, state } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email, password);
    if (result.success) {
      onLoginSuccess?.();
    } else {
      Alert.alert('Login Failed', result.error || 'Please try again');
    }
  };

  const isLoading = state.loading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>MediCo</Text>
        <Text style={styles.tagline}>Patient Transfer Handoff System</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Error message */}
        {state.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{state.error}</Text>
          </View>
        )}

        {/* Email Input */}
        <FormInput
          label="Email"
          placeholder="doctor@hospital.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input with Toggle */}
        <View style={styles.passwordContainer}>
          <FormInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            editable={!isLoading}
            secureTextEntry={!showPassword}
            containerStyle={styles.passwordInput}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <Button
          label={isLoading ? 'Signing in...' : 'Sign In'}
          onPress={handleLogin}
          disabled={isLoading}
          style={styles.loginButton}
        />

        {/* Test Credentials Helper */}
        <View style={styles.testCredentialsBox}>
          <Text style={styles.testCredentialsTitle}>Test Account</Text>
          <Text style={styles.testCredentialsText}>
            Email: doctor1@ruralphc.com
          </Text>
          <Text style={styles.testCredentialsText}>
            Password: test123
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For rural India healthcare network
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  passwordInput: {
    marginBottom: 0,
  },
  toggleButton: {
    position: 'absolute',
    right: SPACING.md,
    top: 40,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    marginVertical: SPACING.md,
  },
  testCredentialsBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  testCredentialsText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: 'monospace',
  },
  footer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export { LoginScreen };
