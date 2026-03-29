import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

export const FilterTabs = ({
  tabs,
  selectedTab,
  onTabChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.tabsWrapper}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.selectedTab,
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.selectedTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E8F1F8',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  selectedTab: {
    backgroundColor: '#D2EEF4',
    borderBottomColor: '#0E4A7C',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A7388',
    letterSpacing: 0.5,
  },
  selectedTabText: {
    color: '#0E4A7C',
    fontWeight: '900',
  },
});
