const GameAudio = (() => {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const effectCooldownsByName = {
    wall: 65,
    paddle: 65,
    brickHit: 55,
    brickBreak: 55,
    combo: 110,
    pickup: 100
  };
  const effectCooldowns = new Map();
  let audioContext = null;
  let effectsGain = null;
  let musicGain = null;
  let noiseBuffer = null;
  let soundEnabled = false;
  let musicTimers = [];
  let musicNoteIndex = 0;
  let rollTimer = 0;
  let rollStartedAt = 0;

  function getContext() {
    if (!AudioContextConstructor) {
      return null;
    }
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      effectsGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      effectsGain.gain.value = 0.7;
      musicGain.gain.value = 0.24;
      effectsGain.connect(audioContext.destination);
      musicGain.connect(audioContext.destination);

      noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      for (let index = 0; index < channel.length; index++) {
        channel[index] = Math.random() * 2 - 1;
      }
    }
    return audioContext;
  }

  function unlockAudio() {
    if (!soundEnabled) {
      return;
    }
    const context = getContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      context.resume();
    }
    startMusic();
  }

  function tone(frequency, duration, volume, waveform = "sine", destination = effectsGain, delay = 0, endFrequency = null) {
    const context = getContext();
    if (!context || !destination) {
      return;
    }
    const startAt = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), startAt + duration);
    }
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startAt + Math.min(0.012, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.01);
  }

  function noise(duration, volume, cutoff, delay = 0) {
    const context = getContext();
    if (!context || !effectsGain || !noiseBuffer) {
      return;
    }
    const startAt = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, startAt);
    envelope.gain.setValueAtTime(Math.max(0.0002, volume), startAt);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(effectsGain);
    source.start(startAt);
    source.stop(startAt + duration + 0.01);
  }

  function play(effect, value = 0) {
    if (!soundEnabled) {
      return;
    }
    const context = getContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      context.resume();
    }

    const now = performance.now();
    const cooldown = effectCooldownsByName[effect] || 0;
    const lastPlayed = effectCooldowns.get(effect);
    if (cooldown && lastPlayed !== undefined && now - lastPlayed < cooldown) {
      return;
    }
    effectCooldowns.set(effect, now);

    if (effect === "hover") {
      tone(680, 0.045, 0.045, "sine", effectsGain, 0, 900);
    } else if (effect === "click") {
      tone(390, 0.065, 0.11, "triangle", effectsGain, 0, 245);
    } else if (effect === "brickHit") {
      tone(340 + Math.min(value, 1) * 90, 0.07, 0.09, "triangle", effectsGain, 0, 225);
    } else if (effect === "brickBreak") {
      noise(0.11, 0.16, 1800);
      tone(240, 0.16, 0.12, "square", effectsGain, 0, 620);
    } else if (effect === "combo") {
      tone(470 + (Math.max(1, value) % 8) * 48, 0.14, 0.12, "sine");
    } else if (effect === "chestReward") {
      [587.33, 739.99, 880, 1174.66].forEach((frequency, index) => {
        tone(frequency, 0.24, 0.16, "triangle", effectsGain, index * 0.11);
      });
      [440, 554.37, 659.25].forEach((frequency) => {
        tone(frequency, 0.48, 0.07, "sine", effectsGain, 0.43);
      });
    } else if (effect === "explosion") {
      noise(0.3, 0.32, 900);
      tone(150, 0.32, 0.22, "sine", effectsGain, 0, 42);
    } else if (effect === "snipe") {
      noise(0.12, 0.18, 3200);
      tone(1400, 0.24, 0.17, "sawtooth", effectsGain, 0, 180);
    } else if (effect === "paddle") {
      noise(0.07, 0.13, 1100);
      tone(190, 0.1, 0.13, "triangle", effectsGain, 0, 110);
    } else if (effect === "wall") {
      tone(720, 0.045, 0.075, "sine", effectsGain, 0, 470);
    } else if (effect === "pickup") {
      tone(660, 0.12, 0.13, "sine");
      tone(990, 0.16, 0.1, "sine", effectsGain, 0.09);
    } else if (effect === "rollTick") {
      tone(500 + (value % 5) * 75, 0.045, 0.055, "triangle");
    }
  }

  function playMusicNote() {
    const melody = [
      440, 523.25, 659.25, 523.25, 392, 493.88, 587.33, 493.88,
      349.23, 440, 523.25, 440, 392, 493.88, 587.33, 659.25
    ];
    const bass = [110, 130.81, 87.31, 98];
    const chords = [
      [220, 261.63, 329.63],
      [261.63, 329.63, 392],
      [174.61, 220, 261.63],
      [196, 246.94, 293.66]
    ];
    const step = musicNoteIndex % melody.length;
    tone(melody[step], 0.22, 0.085, "triangle", musicGain);
    if (step % 2 === 0) {
      tone(bass[(step / 2) % bass.length], 0.38, 0.09, "sine", musicGain);
    }
    if (step % 4 === 0) {
      const chord = chords[(step / 4) % chords.length];
      chord.forEach((frequency, index) => {
        tone(frequency, 0.95, 0.025, "sine", musicGain, index * 0.018);
      });
    }
    musicNoteIndex += 1;
  }

  function startMusic() {
    if (!soundEnabled || musicTimers.length || !getContext()) {
      return;
    }
    playMusicNote();
    musicTimers.push(window.setInterval(playMusicNote, 250));
  }

  function stopMusic() {
    for (const timer of musicTimers) {
      window.clearInterval(timer);
    }
    musicTimers = [];
  }

  function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    if (!enabled) {
      stopMusic();
      stopChestRoll();
    }
    if (enabled) {
      unlockAudio();
    }
    if (musicGain) {
      musicGain.gain.setTargetAtTime(enabled ? 0.24 : 0, audioContext.currentTime, 0.04);
    }
    if (effectsGain) {
      effectsGain.gain.setTargetAtTime(enabled ? 0.7 : 0, audioContext.currentTime, 0.02);
    } else {
      stopMusic();
    }
  }

  function startChestRoll() {
    stopChestRoll();
    if (!soundEnabled) {
      return;
    }
    rollStartedAt = performance.now();
    let tick = 0;
    const scheduleTick = () => {
      const progress = Math.min(1, (performance.now() - rollStartedAt) / 4000);
      play("rollTick", tick++);
      if (progress < 1) {
        rollTimer = window.setTimeout(scheduleTick, 150 - progress * 95);
      } else {
        rollTimer = 0;
      }
    };
    scheduleTick();
  }

  function stopChestRoll() {
    if (rollTimer) {
      window.clearTimeout(rollTimer);
      rollTimer = 0;
    }
  }

  document.addEventListener("pointerdown", unlockAudio, true);
  document.addEventListener("keydown", unlockAudio, true);
  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const button = event.target.closest("button, input[type='button'], input[type='submit']");
    if (button && !button.disabled && (!event.relatedTarget || !button.contains(event.relatedTarget))) {
      play("hover");
    }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, input[type='button'], input[type='submit']");
    if (button && !button.disabled) {
      unlockAudio();
      play("click");
    }
  }, true);

  return {
    play,
    setSoundEnabled,
    startMusic,
    startChestRoll,
    stopChestRoll
  };
})();
