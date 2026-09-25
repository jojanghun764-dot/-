import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

if (Capacitor.isNativePlatform()) {
  window.sproutShareSave = async (payload) => {
    const name = 'sprout-save-' + new Date().toISOString().slice(0, 10) + '.json';
    const result = await Filesystem.writeFile({ path: name, data: payload, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: '새싹 원정대 세이브 백업', url: result.uri, dialogTitle: '안전한 곳에 세이브 파일 저장' });
  };
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
  if (__SPROUT_TEST_ADS__ && Capacitor.getPlatform() === 'android') {
    let adBusy = false;
    (async () => {
      await AdMob.initialize({ initializeForTesting: true });
      let consent = await AdMob.requestConsentInfo();
      if (!consent.canRequestAds) consent = await AdMob.showConsentForm();
      if (!consent.canRequestAds) return;
      window.sproutRewardAdsEnabled = true;
      window.sproutWatchRewardedAd = async () => {
        if (adBusy) return;
        adBusy = true;
        let rewarded = false;
        const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          if (rewarded) return;
          rewarded = true;
          window.grantRewardedAd?.();
        });
        try {
          await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917', isTesting: true });
          await AdMob.showRewardVideoAd();
        } finally {
          await listener.remove();
          adBusy = false;
        }
      };
      window.renderPages?.();
    })().catch((error) => console.warn('Test ads unavailable', error));
  }
}
