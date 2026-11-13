// Stub for an ad SDK. NOT integrated with any real network.
// Week 2 will paint the call sites (menu, game over, reward) behind this API.
// No account, network call, or payment is made here.

export const AdStub = {
  isEnabled: false,

  async showRewarded() {
    if (!this.isEnabled) {
      console.info('[AdStub] rewarded ad requested (disabled) — no-op');
      return { rewarded: false, reason: 'stub' };
    }
    return { rewarded: false, reason: 'not_implemented' };
  },

  async showInterstitial() {
    if (!this.isEnabled) {
      console.info('[AdStub] interstitial requested (disabled) — no-op');
      return { shown: false, reason: 'stub' };
    }
    return { shown: false, reason: 'not_implemented' };
  },
};
