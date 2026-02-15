import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

// Orchestral worship pad - majestic, peaceful, glorious
const AmbientSound = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const nodesRef = useRef<OscillatorNode[]>([]);

  const startSound = useCallback(() => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    isPlayingRef.current = true;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
    masterGain.connect(ctx.destination);

    // Reverb simulation
    const convolver = ctx.createConvolver();
    const reverbLength = ctx.sampleRate * 3;
    const impulse = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < reverbLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.5);
      }
    }
    convolver.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);

    // Majestic orchestral pad - C major with extensions
    // Root C2, E2, G2, C3, E3, G3, B3 (Cmaj7 spread voicing)
    const padFreqs = [65.41, 82.41, 98.0, 130.81, 164.81, 196.0, 246.94];
    const padGains = [0.25, 0.2, 0.2, 0.3, 0.15, 0.15, 0.1];

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Gentle vibrato for warmth
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.15 + Math.random() * 0.1;
      lfoGain.gain.value = freq * 0.003;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const gain = ctx.createGain();
      gain.gain.value = padGains[i];

      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(convolver);
      osc.start();
      nodesRef.current.push(osc, lfo);
    });

    // Ethereal high strings - slow evolving shimmer
    const shimmerFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    shimmerFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      // Slow breathing amplitude
      const ampLfo = ctx.createOscillator();
      const ampLfoGain = ctx.createGain();
      ampLfo.type = "sine";
      ampLfo.frequency.value = 0.05 + Math.random() * 0.03;
      ampLfoGain.gain.value = 0.015;
      ampLfo.connect(ampLfoGain);
      ampLfoGain.connect(gain.gain);
      gain.gain.value = 0.02;

      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(convolver);
      osc.start();
      ampLfo.start();
      nodesRef.current.push(osc, ampLfo);
    });

    // Subtle sub-bass for depth and majesty
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 32.7; // C1
    const subGain = ctx.createGain();
    subGain.gain.value = 0.08;
    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start();
    nodesRef.current.push(sub);

    setIsPlaying(true);
  }, []);

  const stopSound = useCallback(() => {
    isPlayingRef.current = false;
    
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      // Fade out gracefully
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Stop all nodes after fade
      nodesRef.current.forEach(node => {
        try { node.stop(now + 2); } catch { /* ignore */ }
      });
      nodesRef.current = [];
      
      setTimeout(() => {
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      }, 2500);
    }
    setIsPlaying(false);
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      nodesRef.current.forEach(node => {
        try { node.stop(); } catch { /* ignore */ }
      });
      nodesRef.current = [];
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div
      className="fixed right-4 z-40"
      style={{
        bottom: "calc(10rem + max(0.5rem, env(safe-area-inset-bottom, 8px)))",
      }}
    >
      <motion.button
        onClick={toggleSound}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        whileTap={{ scale: 0.9 }}
        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors ${
          isPlaying
            ? "bg-primary text-primary-foreground"
            : "bg-card/90 backdrop-blur-sm text-muted-foreground border border-border"
        }`}
        aria-label={isPlaying ? "Desativar som ambiente" : "Ativar som ambiente"}
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-card px-3 py-1.5 text-xs text-foreground shadow-md border border-border"
          >
            {isPlaying ? "Adoração ambiente 🎶" : "Som de adoração"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmbientSound;
