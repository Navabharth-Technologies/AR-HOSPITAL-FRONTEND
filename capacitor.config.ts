import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arhospital.app',
  appName: 'ARHospital',
  webDir: 'out',
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      resetWhenUpdate: false
    }
  }
};

export default config;
