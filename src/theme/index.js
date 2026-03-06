export const Colors = {
  // 🔵 Brand Colors
  primary: '#1565C0',        // Main Blue
  primaryDark: '#0D47A1',    // Deep Navy Blue
  primaryLight: '#E3F2FD',   // Very Light Blue

  // ⚪ Base
  white: '#FFFFFF',
  background: '#F4F7FB',     // Soft blue-grey background
  cardBg: '#FFFFFF',

  // 📝 Text
  titleText: '#0A1F44',      // Dark navy text
  subtitleText: '#5F6C7B',

  // 📦 Inputs
  inputBorder: '#DCE3EA',
  inputPlaceholder: '#9AA5B1',

  // 🚫 Disabled
  disabledBtn: '#D6DCE3',
  disabledText: '#8A96A3',

  // 🔔 Snackbar
  snackbar: '#1E293B',

  // 📊 Attendance Status Colors
  success: '#2E7D32',        // Present (Green)
  warning: '#F9A825',        // Late (Yellow)
  error: '#C62828',          // Absent (Red)
  leave: '#42A5F5',          // Leave (Light Blue)
};
export const Typography = {
  fontBold: { fontWeight: '700' },
  fontMedium: { fontWeight: '500' },
  fontRegular: { fontWeight: '400' },
  h1: { fontSize: 34, fontWeight: '700', letterSpacing: 1.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 50,
};
export default { Colors, Typography, Spacing, Radius };