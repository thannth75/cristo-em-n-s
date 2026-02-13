import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const AmbientSound = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscillators: OscillatorNode[]; gains: GainNode[] }>({ oscillators: [], gains: [] });

  const createAmbientSound = () => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Warm pad chord (Cmaj7 - peaceful)
    const frequencies = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.04 - i * 0.005; // Softer for higher notes
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      gains.push(gain);

      // Gentle frequency modulation for warmth
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
    });

    // Add gentle noise for "nature" feel
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.008;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 400;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.3;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();

    // Fade in
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);

    nodesRef.current = { oscillators, gains };
    return { masterGain };
  };

  const toggleSound = () => {
    if (isPlaying) {
      // Fade out and stop
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        const masterGain = ctx.destination;
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsPlaying(false);
    } else {
      createAmbientSound();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-40" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
            {isPlaying ? "Som ambiente ligado" : "Ativar som ambiente"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmbientSound;
