import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/GlassCard';
import { GLASS_THEME } from '../../theme/designSystem';

export default function GlassChildProfile() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainCanvas}>
        {/* 🌈 Ambient Light Orbs in Background */}
        <LinearGradient
          colors={GLASS_THEME.orbPrimary}
          style={[styles.ambientOrb, styles.orbTopLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={GLASS_THEME.orbSecondary}
          style={[styles.ambientOrb, styles.orbBottomRight]}
          pointerEvents="none"
        />

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollLayout} 
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {/* 👶 Hero Profile Glass Panel */}
          <GlassCard intensity={60} style={{ marginTop: 20 }}>
            <View style={styles.profileHeroCenter}>
              <View style={styles.avatarGlassRing}>
                <Text style={{ fontSize: 44 }}>👶</Text>
              </View>
              <Text style={styles.childNameText}>V krish</Text>
              <View style={styles.glassBadge}>
                <Text style={styles.glassBadgeText}>SR. PLAYGROUP</Text>
              </View>
            </View>

            {/* 📊 Metric Row inside Glass Panel */}
            <View style={styles.metricRow}>
              <View style={styles.metricNode}>
                <Text style={styles.metricLabel}>AGE</Text>
                <Text style={styles.metricVal}>3 Yrs</Text>
              </View>
              <View style={styles.glassDivider} />
              <View style={styles.metricNode}>
                <Text style={styles.metricLabel}>BLOOD</Text>
                <Text style={styles.metricVal}>O+</Text>
              </View>
              <View style={styles.glassDivider} />
              <View style={styles.metricNode}>
                <Text style={styles.metricLabel}>CLASS NO</Text>
                <Text style={styles.metricVal}>#2026</Text>
              </View>
            </View>
          </GlassCard>

          {/* 📋 Vital Information Glass Block */}
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <GlassCard intensity={40}>
            <View style={styles.dataRow}>
              <Ionicons name="card-outline" size={22} color="#4A00E0" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dataLabel}>Registration ID</Text>
                <Text style={styles.dataValue}>J4FV2ZrJEOeaMleJzCaL</Text>
              </View>
            </View>

            <View style={styles.glassLineSeparator} />

            <View style={styles.dataRow}>
              <Ionicons name="call-outline" size={22} color="#FF007A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dataLabel}>Emergency Contact</Text>
                <Text style={styles.dataValue}>8778696408</Text>
              </View>
            </View>
          </GlassCard>

          {/* 🏫 School Details Glass Block */}
          <Text style={styles.sectionTitle}>School Connection</Text>
          <GlassCard intensity={40} style={{ marginBottom: 40 }}>
            <View style={styles.dataRow}>
              <Ionicons name="school-outline" size={22} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dataLabel}>Institution</Text>
                <Text style={styles.dataValue}>SHISHUVIHAR Playschool</Text>
              </View>
            </View>

            <View style={styles.glassLineSeparator} />

            <View style={styles.dataRow}>
              <Ionicons name="time-outline" size={22} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dataLabel}>Timing</Text>
                <Text style={styles.dataValue}>09:00 AM - 12:30 PM</Text>
              </View>
            </View>
          </GlassCard>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  mainCanvas: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollLayout: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  ambientOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.5,
  },
  orbTopLeft: {
    top: -20,
    left: -40,
  },
  orbBottomRight: {
    bottom: 40,
    right: -40,
  },
  profileHeroCenter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarGlassRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 12,
  },
  childNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  glassBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  glassBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
  },
  metricNode: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  glassDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  glassLineSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginVertical: 14,
  },
});