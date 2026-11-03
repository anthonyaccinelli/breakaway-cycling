import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ridebreakaway.ipad',
  appName: 'Ride Breakaway',
  webDir: 'dist',
  ios: { contentInset: 'never', preferredContentMode: 'mobile' },
};

export default config;
