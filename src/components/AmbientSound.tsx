import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

// Notas de hinos da Harpa Cristã em escalas pentatônicas suaves
const HARP_SEQUENCES = [
  // Harpa 1 - Paz (C major pentatonic ascending)
  [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0],
  // Harpa 2 - Alegria (G major pentatonic)
  [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0],
  // Harpa 3 - Serenidade (F major)
  [349.23, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0],
  // Harpa 4 - Contemplação (Am pentatonic)
  [220.0, 261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 261.63],
];

const AmbientSound = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  const playHarpNote = useCallback((ctx: AudioContext, frequency: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Triangle wave para som de harpa suave
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, time);
    
    // Adicionar leve detune para riqueza
    osc.detune.setValueAtTime(Math.random() * 6 - 3, time);
    
    // Envelope ADSR tipo harpa (ataque rápido, decaimento longo)
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.08, time + 0.02); // Ataque rápido
    gainNode.gain.exponentialRampToValueAtTime(0.04, time + 0.3); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // Release longo
    
    // Harmônico suave
    const harmonic = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(frequency * 2, time);
    harmonicGain.gain.setValueAtTime(0, time);
    harmonicGain.gain.linearRampToValueAtTime(0.015, time + 0.02);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.6);
    
    // Reverb simulado com delay
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.15;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.2;
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
    
    harmonic.connect(harmonicGain);
    harmonicGain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
    harmonic.start(time);
    harmonic.stop(time + duration + 0.1);
  }, []);

  const playSequence = useCallback((ctx: AudioContext) => {
    if (!isPlayingRef.current || ctx.state === "closed") return;
    
    const sequence = HARP_SEQUENCES[Math.floor(Math.random() * HARP_SEQUENCES.length)];
    const noteInterval = 0.8 + Math.random() * 0.4; // Intervalo variável entre notas
    const noteDuration = 2.5 + Math.random() * 1.5;
    
    sequence.forEach((freq, i) => {
      if (ctx.state !== "closed") {
        playHarpNote(ctx, freq, ctx.currentTime + i * noteInterval, noteDuration);
      }
    });
    
    // Agendar próxima sequência com pausa contemplativa
    const totalDuration = sequence.length * noteInterval + 2 + Math.random() * 3;
    const timeout = window.setTimeout(() => {
      playSequence(ctx);
    }, totalDuration * 1000);
    
    timeoutsRef.current.push(timeout);
  }, [playHarpNote]);

  const startSound = useCallback(() => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    isPlayingRef.current = true;
    
    // Pad base muito suave para preenchimento
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    padOsc.type = "sine";
    padOsc.frequency.value = 130.81; // C3
    padGain.gain.value = 0;
    padGain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 3);
    padOsc.connect(padGain);
    padGain.connect(ctx.destination);
    padOsc.start();
    
    // Iniciar sequência de harpa após fade-in
    const timeout = window.setTimeout(() => {
      playSequence(ctx);
    }, 1500);
    timeoutsRef.current.push(timeout);
    
    setIsPlaying(true);
  }, [playSequence]);

  const stopSound = useCallback(() => {
    isPlayingRef.current = false;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
      timeoutsRef.current.forEach(clearTimeout);
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
            {isPlaying ? "Harpa tocando 🎵" : "Tocar harpa suave"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmbientSound;
