import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

export const Button = ({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  // Support both title and label props
  const buttonText = title || label;
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryVariant;
      case 'secondary':
        return styles.secondaryVariant;
      case 'danger':
        return styles.dangerVariant;
      case 'ghost':
        return styles.ghostVariant;
      default:
        return styles.primaryVariant;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smallSize;
      case 'md':
        return styles.mediumSize;
      case 'lg':
        return styles.largeSize;
      default:
        return styles.mediumSize;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return styles.primaryTextVariant;
      case 'secondary':
        return styles.secondaryTextVariant;
      case 'ghost':
        return styles.ghostTextVariant;
      default:
        return styles.primaryTextVariant;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text style={[styles.text, getTextVariantStyle(), textStyle]}>
          {buttonText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Variants
  primaryVariant: {
    backgroundColor: COLORS.primary,
  },
  secondaryVariant: {
    backgroundColor: COLORS.gray200,
  },
  dangerVariant: {
    backgroundColor: COLORS.error,
  },
  ghostVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  // Sizes
  smallSize: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  mediumSize: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  largeSize: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  // Text styles
  text: {
    ...TYPOGRAPHY.button,
  },
  primaryTextVariant: {
    color: COLORS.white,
  },
  secondaryTextVariant: {
    color: COLORS.textPrimary,
  },
  ghostTextVariant: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
