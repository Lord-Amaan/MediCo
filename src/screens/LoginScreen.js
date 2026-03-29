import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLarge = width >= 1024;

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid work email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
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
      Alert.alert('Unable to Sign In', result.error || 'Please verify your credentials and try again.');
    }
  };

  const isLoading = state.loading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isTablet && styles.contentTablet,
        isLarge && styles.contentLarge,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      {/* Header */}
      <View style={[styles.headerContainer, isTablet && styles.headerTablet]}>
        <View style={[styles.brandWrap, isTablet && styles.brandWrapTablet]}>
          <View style={[styles.brandEmblemOuter, isTablet && styles.brandEmblemOuterTablet]}>
            <View style={styles.brandPulseDot} />
            <View style={[styles.brandEmblemInner, isTablet && styles.brandEmblemInnerTablet]}>
              <Text style={styles.brandEmblemText}>+</Text>
            </View>
          </View>
          <Text style={[styles.brandNameText, isTablet && styles.brandNameTextTablet]}>MediCo</Text>
        </View>
        <View style={[styles.signInBadge, isTablet && styles.signInBadgeTablet]}>
          <Text style={[styles.logoText, isTablet && styles.logoTextTablet]}>Sign In</Text>
        </View>
        <Text style={[styles.tagline, isTablet && styles.taglineTablet]}>Patient Transfer Handoff System</Text>
      </View>

      {/* Form */}
      <View style={[styles.formCard, isTablet && styles.formCardTablet, isLarge && styles.formCardLarge]}>
        {/* Error message */}
        {state.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{state.error}</Text>
          </View>
        )}

        <View style={styles.formTitleWrap}>
          <View style={styles.formTitleAccent} />
          <Text style={[styles.formTitle, isTablet && styles.formTitleTablet]}>Welcome</Text>
          <View style={styles.formTitleAccent} />
        </View>

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
          containerStyle={styles.fieldContainer}
          labelStyle={styles.fieldLabel}
          inputStyle={styles.fieldInput}
          errorStyle={styles.fieldError}
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
            labelStyle={styles.fieldLabel}
            inputStyle={styles.fieldInput}
            errorStyle={styles.fieldError}
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
          textStyle={styles.loginButtonText}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Rural India healthcare network
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FA',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    justifyContent: 'center',
  },
  contentTablet: {
    paddingHorizontal: SPACING.xl,
  },
  contentLarge: {
    paddingHorizontal: SPACING.xxl,
  },
  bgOrbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D2EEF4',
    top: -90,
    right: -70,
    opacity: 0.8,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFE0CC',
    bottom: -120,
    left: -110,
    opacity: 0.7,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: 0,
    paddingHorizontal: SPACING.md,
  },
  headerTablet: {
    marginBottom: SPACING.xl,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    gap: SPACING.md,
  },
  brandWrapTablet: {
    marginBottom: 44,
    gap: SPACING.lg,
  },
  brandEmblemOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0A365D',
    borderWidth: 2,
    borderColor: '#2D7FBA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B2239',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  brandEmblemOuterTablet: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  brandPulseDot: {
    position: 'absolute',
    right: -2,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#59D9A5',
    borderWidth: 2,
    borderColor: '#EAF8F2',
  },
  brandEmblemInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E6EA8',
    borderWidth: 2,
    borderColor: '#D5ECFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmblemInnerTablet: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  brandEmblemText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  brandNameText: {
    fontSize: 30,
    color: '#0E4A7C',
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  brandNameTextTablet: {
    fontSize: 34,
  },
  signInBadge: {
    borderWidth: 1,
    borderColor: '#CFE2F1',
    backgroundColor: '#F7FBFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  signInBadgeTablet: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15466E',
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  logoTextTablet: {
    fontSize: 18,
  },
  tagline: {
    fontSize: 13,
    color: '#486076',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  taglineTablet: {
    fontSize: 15,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#D9E7F2',
    shadowColor: '#0B2239',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  formCardTablet: {
    alignSelf: 'center',
    width: '88%',
    maxWidth: 560,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  formCardLarge: {
    maxWidth: 620,
  },
  formTitle: {
    fontSize: 22,
    color: '#0B2239',
    fontWeight: '900',
    marginBottom: SPACING.md,
    letterSpacing: 0.35,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  formTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  formTitleAccent: {
    height: 2,
    width: 24,
    borderRadius: 1,
    backgroundColor: '#9EC9E8',
  },
  formTitleTablet: {
    fontSize: 26,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: '#FFF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#D93025',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  errorBannerText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#355067',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  fieldContainer: {
    marginLeft: 4,
  },
  fieldInput: {
    fontSize: 16,
    color: '#102A43',
    fontWeight: '600',
    borderRadius: 12,
    borderColor: '#CFE0ED',
    backgroundColor: '#F8FCFF',
    paddingVertical: 14,
    paddingLeft: 10,
    paddingRight: 12,
  },
  fieldError: {
    fontSize: 12,
    color: '#B42318',
    marginTop: 6,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  passwordInput: {
    marginBottom: 0,
    marginLeft: 4,
  },
  toggleButton: {
    position: 'absolute',
    right: SPACING.md,
    top: 39,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  toggleText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 12,
    backgroundColor: '#0F4C81',
    shadowColor: '#0F4C81',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  loginButtonText: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#5D7285',
    fontWeight: '600',
  },
});

export { LoginScreen };
