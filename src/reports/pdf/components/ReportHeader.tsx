// src/reports/pdf/components/ReportHeader.tsx
import React from 'react';
import { View, Text, Image, Svg, Polygon, Path, StyleSheet } from '@react-pdf/renderer';
import { brand } from '../../branding';

// Logo lives in /public, so it is served from the site root (no import needed).
// Change the file name/extension if yours differs (e.g. '/logo.jpg').
// Absolute URL avoids react-pdf failing to resolve a relative path.
const LOGO_SRC =
  typeof window !== 'undefined' ? `${window.location.origin}/logo.jpg` : '/logo.jpg';

/** Must match the `padding` you use on <Page>. The banner bleeds past it to the page edges. */
const PAGE_PADDING = 36;
const BAND_H = 66;

const NAVY = brand.colors.navy;
const ACCENT = brand.colors.leaf; // swap for another brand colour if you prefer

// Material-style icon paths (24x24 viewBox)
const ICONS = {
  phone:
    'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  mail:
    'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  pin:
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
};

const styles = StyleSheet.create({
  // full-bleed banner
  banner: {
    position: 'relative',
    height: BAND_H,
    marginTop: -PAGE_PADDING,
    marginLeft: -PAGE_PADDING,
    marginRight: -PAGE_PADDING,
  },
  accentBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 70,
    right: 0,
    backgroundColor: ACCENT,
  },
  shapeLayer: { position: 'absolute', top: 0, left: 0 },
  logoWrap: {
    position: 'absolute',
    left: 34,
    top: 17,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 32, height: 32, objectFit: 'contain' },

  contactRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 128,
    right: PAGE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItem: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  contactText: { fontSize: 6.5, color: '#FFFFFF', textAlign: 'center', marginTop: 3, lineHeight: 1.3 },

  // org name + date row under the banner
  orgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 6,
  },
  orgName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  tagline: { fontSize: 7.5, color: brand.colors.muted, marginTop: 1 },
  metaLine: { fontSize: 7.5, color: brand.colors.muted },

  rule: { height: 1.5, backgroundColor: ACCENT, marginBottom: 12 },
  titleBlock: { marginBottom: 10 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  subtitle: { fontSize: 9, color: brand.colors.navyMuted },
});

function Icon({ d }: { d: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24">
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

function ContactItem({ icon, lines }: { icon: keyof typeof ICONS; lines: string[] }) {
  return (
    <View style={styles.contactItem}>
      <Icon d={ICONS[icon]} />
      {lines.map((l, i) => (
        <Text key={i} style={styles.contactText}>
          {l}
        </Text>
      ))}
    </View>
  );
}

export function ReportHeader({
  title,
  subtitle,
  generatedAt,
  phone,
  email,
  address,
}: {
  title: string;
  subtitle?: string;
  generatedAt: string;
  phone?: string[];
  email?: string[];
  address?: string[];
}) {
  // Fall back to values on brand.org if you have them, otherwise the item is skipped.
  const org = brand.org as unknown as Record<string, any>;
  const phones = phone ?? (org.phone ? [org.phone] : []);
  const emails = email ?? (org.email ? [org.email] : []);
  const addr = address ?? (org.address ? [org.address] : []);

  return (
    <View fixed>
      {/* ── Banner ── */}
      <View style={styles.banner}>
        {/* accent band sits behind the navy arrow */}
        <View style={styles.accentBand} />

        {/* navy arrow + white hexagon */}
        <Svg width={130} height={BAND_H} viewBox="0 0 130 66" style={styles.shapeLayer}>
          <Polygon points="0,0 104,0 130,33 104,66 0,66" fill={NAVY} />
          <Polygon points="26,33 40,9 66,9 80,33 66,57 40,57" fill="#FFFFFF" />
        </Svg>

        {/* logo centred inside the hexagon (hexagon centre = x 53, y 33) */}
        <View style={styles.logoWrap}>
          <Image src={LOGO_SRC} style={styles.logo} />
        </View>

        {/* contact strip */}
        <View style={styles.contactRow}>
          {phones.length > 0 && <ContactItem icon="phone" lines={phones} />}
          {emails.length > 0 && <ContactItem icon="mail" lines={emails} />}
          {addr.length > 0 && <ContactItem icon="pin" lines={addr} />}
        </View>
      </View>

      {/* ── Org name + generated date ── */}
      <View style={styles.orgRow}>
        <View>
          <Text style={styles.orgName}>{brand.org.name}</Text>
          <Text style={styles.tagline}>{brand.org.tagline}</Text>
        </View>
        <Text style={styles.metaLine}>Generated {generatedAt}</Text>
      </View>
      <View style={styles.rule} />

      {/* ── Title ── */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}