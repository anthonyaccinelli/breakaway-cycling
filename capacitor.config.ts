import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ridebreakaway.app',
  appName: 'Ride Breakaway',
  webDir: 'dist',
  server: { iosScheme: 'capacitor' },
  ios: { contentInset: 'automatic' },
};

export default config;
