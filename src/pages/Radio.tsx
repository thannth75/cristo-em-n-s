import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Radio as RadioIcon, Play, Pause, Volume2, VolumeX,
  Waves, Moon,
} from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { cn, getUserFirstName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATION = {
  name: "Rádio Obra em Restauração",
  description: "Louvores e pregações 24h",
  url: "https://stream.zeno.fm/yn65fsaurfhvv",
  genre: "Gospel / Adoração",
};

const Radio = () => {
  const { profile, isLoading: authLoading } = useAuthRedirect();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimeLeft, setSleepTimeLeft] = useState(0);

  // Sleep timer
  useEffect(() => {
    if (sleepTimer === null) return;
    setSleepTimeLeft(sleepTimer * 60);
    const interval = setInterval(() => {
      setSleepTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSleepTimer(null);
          if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
          toast({ title: "⏰ Sleep timer", description: "A reprodução foi pausada." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer, toast]);

  const playStation = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setIsBuffering(true);
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : 0.8;
    audioRef.current = audio;

    audio.addEventListener("canplay", () => {
      setIsBuffering(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false); setIsBuffering(false);
      });
    }, { once: true });
    audio.addEventListener("waiting", () => setIsBuffering(true));
    audio.addEventListener("playing", () => { setIsBuffering(false); setIsPlaying(true); });
    audio.addEventListener("error", () => {
      setIsBuffering(false); setIsPlaying(false);
      toast({ title: "Erro", description: "Não foi possível conectar à rádio.", variant: "destructive" });
    }, { once: true });

    audio.src = STATION.url;
    audio.load();
  }, [isMuted, toast]);

  const togglePlay = () => {
    if (!audioRef.current?.src) { playStation(); return; }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : 0.8;
  }, [isMuted]);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute("src"); } };
  }, []);

  if (authLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={getUserFirstName(profile)} />

      <main className="py-6">
        <ResponsiveContainer size="lg">
          <div className="flex flex-col items-center text-center space-y-8 py-8">
            {/* Station visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className={cn(
                "flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 shadow-2xl transition-all",
                isPlaying && "shadow-primary/30"
              )}>
                {isPlaying ? (
                  <div className="flex items-end gap-1.5 h-14">
                    {[1, 2, 3, 4, 5].map(bar => (
                      <motion.div key={bar} className="w-2 rounded-full bg-white/90"
                        animate={{ height: [8, 40, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5 + bar * 0.12, ease: "easeInOut" }} />
                    ))}
                  </div>
                ) : (
                  <RadioIcon className="h-16 w-16 text-white/90" />
                )}
              </div>
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.div>

            <div className="space-y-1">
              <h1 className="font-serif text-xl font-bold text-foreground">{STATION.name}</h1>
              <p className="text-sm text-muted-foreground">{STATION.description}</p>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mt-2">
                {STATION.genre}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline" className="h-11 w-11 rounded-full"
                onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                {isBuffering ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="h-7 w-7 fill-current ml-1" />
                )}
              </motion.button>

              <Button size="icon" variant="outline"
                className={cn("h-11 w-11 rounded-full", sleepTimer !== null && "border-primary text-primary")}
                onClick={() => sleepTimer !== null ? setSleepTimer(null) : setSleepTimer(30)}>
                <Moon className="h-5 w-5" />
              </Button>
            </div>

            {sleepTimer !== null && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-primary font-mono">
                ⏰ Desliga em {Math.floor(sleepTimeLeft / 60)}:{String(sleepTimeLeft % 60).padStart(2, "0")}
              </motion.p>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Waves className="h-3.5 w-3.5" />
              {isPlaying ? "Transmissão ao vivo" : "Toque para ouvir"}
            </div>
          </div>
        </ResponsiveContainer>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Radio;
