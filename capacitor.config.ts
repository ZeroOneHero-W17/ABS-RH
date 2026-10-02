import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doualair.absences',
  appName: 'Doualair Absences',
  webDir: 'public',
  server: {
    url: 'https://abs-rh.vercel.app',
    cleartext: false,
    allowNavigation: ['abs-rh.vercel.app'],
  },
};

export default config;