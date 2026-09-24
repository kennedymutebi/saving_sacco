// src/reports/pdf/components/ReportFooter.tsx
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { brand } from '../../branding';

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
  },
  accent: { height: 3, backgroundColor: brand.colors.navy, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  text: { fontSize: 7, color: brand.colors.muted },
});

export function ReportFooter() {
  return (
    <View style={styles.wrap} fixed>
      <View style={styles.accent} />
      <View style={styles.row}>
        <Text style={styles.text}>{brand.org.name} · Confidential</Text>
        <Text
          style={styles.text}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );
}