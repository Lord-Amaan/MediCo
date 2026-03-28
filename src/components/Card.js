import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants';

export const Card = ({
  children,
  style,
  shadow = 'small',
  padding = SPACING.lg,
}) => {
  const getShadowStyle = () => {
    switch (shadow) {
      case 'small':
        return SHADOWS.small;
      case 'medium':
        return SHADOWS.medium;
      case 'large':
        return SHADOWS.large;
      case 'none':
        return {};
      default:
        return SHADOWS.small;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { padding },
        getShadowStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
});
