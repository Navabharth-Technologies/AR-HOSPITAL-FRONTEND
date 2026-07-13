"use client";

import { useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

export function CapgoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const checkGitHubUpdates = async () => {
      try {
        await CapacitorUpdater.notifyAppReady();

        // Check the latest release on GitHub
        const response = await fetch('https://api.github.com/repos/Navabharth-Technologies/AR-HOSPITAL-FRONTEND/releases/latest');
        if (!response.ok) return;

        const release = await response.json();
        const latestVersion = release.tag_name;
        
        const asset = release.assets?.find((a: any) => a.name === 'update.zip');
        if (!asset) return;

        const downloadUrl = asset.browser_download_url;

        // Get currently running version
        const currentResult = await CapacitorUpdater.current();
        const currentVersion = currentResult?.bundle?.version || currentResult?.bundle?.id || '';

        // If there's a new version on GitHub, download and apply it
        if (latestVersion && latestVersion !== currentVersion) {
          console.log(`Downloading new GitHub OTA update: ${latestVersion}`);
          
          const newBundle = await CapacitorUpdater.download({
            url: downloadUrl,
            version: latestVersion,
          });
          
          // Set the new bundle to be active on next app launch
          await CapacitorUpdater.set({ id: newBundle.id });
        }
      } catch (error) {
        console.error('GitHub OTA Update failed:', error);
      }
    };

    if (Capacitor.isNativePlatform()) {
      checkGitHubUpdates();
    }
  }, []);

  return <>{children}</>;
}
