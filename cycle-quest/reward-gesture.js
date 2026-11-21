// Reward selection uses live trainer signals and wall-clock time.
export function createRewardGesture() {
  return {
    sample() {},
    // `pedal` is what keeping on pedaling picks (heal when HP is low, coins otherwise);
    // stopping for 2 seconds picks the other one.
    begin(now, pedal = 'coins') {
      return { selected: pedal, pedal, end: now + 10000, stopSince: null };
    },
    update(choice, now, cadence, power, connected = true) {
      if (!connected) {
        choice.stopSince = null;
        return;
      }
      if (Number.isFinite(cadence) && Number.isFinite(power) && cadence <= 0 && power < 10) {
        choice.stopSince ??= now;
        if (now - choice.stopSince >= 2000) choice.selected = choice.pedal === 'heal' ? 'coins' : 'heal';
      } else {
        choice.stopSince = null;
        choice.selected = choice.pedal || 'coins';
      }
    }
  };
}
