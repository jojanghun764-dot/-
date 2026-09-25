import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

if (Capacitor.isNativePlatform()) {
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) window.persistState?.();
  });
  App.addListener('backButton', () => {
    const openOverlay = [...document.querySelectorAll('.overlay.show')].at(-1);
    if (openOverlay) {
      openOverlay.classList.remove('show');
      return;
    }
    if (document.querySelector('#starterScreen.show')) {
      document.querySelector('#starterBackBtn')?.click();
      return;
    }
    if (document.querySelector('#startScreen.show')) {
      App.minimizeApp();
      return;
    }
    // Keep gameplay running; the system handles app switching.
    App.minimizeApp();
  });
}
