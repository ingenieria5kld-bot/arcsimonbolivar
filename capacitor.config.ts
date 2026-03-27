import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arc.simonbolivar',
  appName: 'ARC Simon Bolivar',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'accounts.google.com',
      'apis.google.com',
      '*.google.com',
      '*.googleapis.com'
    ]
  }
};

export default config;
