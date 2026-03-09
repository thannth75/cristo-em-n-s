import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio as RadioIcon, Play, Pause, Volume2, VolumeX,
  SkipForward, Music2, Heart, ExternalLink, Globe,
  Headphones, Waves, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Free Christian radio streams
const radioStations = [
  {
    id: "ipb",
    name: "Rádio Obra em Restauração",
    description: "Louvores e pregações do ministério",
    url: "https://stream.zeno.fm/yn65fsaurfhvv",
    genre: "Gospel / Adoração",
    color: "from-primary to-emerald-700",
  },
  {
    id: "gospel-fm",
    name: "Gospel FM",
    description: "As melhores músicas gospel 24h",
    url: "https://stream.zeno.fm/0r0xa792kwzuv",
    genre: "Gospel Contemporâneo",
    color: "from-amber-600 to-orange-700",
  },
  {
    id: "adoracao",
    name: "Rádio Adoração",
    description: "Louvores para o seu momento com Deus",
    url: "https://stream.zeno.fm/dpnb0myk5e8uv",
    genre: "Adoração & Louvor",
    color: "from-violet-600 to-purple-800",
  },
  {
    id: "louvor-eterno",
    name: "Louvor Eterno",
    description: "Hinos clássicos e contemporâneos",
    url: "https://stream.zeno.fm/hb46bemirhruv",
    genre: "Hinos & Clássicos",
    color: "from-sky-600 to-blue-800",
  },
];

const Radio = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentStation, setCurrentStation] = useState(radioStations[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playStation = (station: typeof radioStations[0]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setCurrentStation(station);
    setIsBuffering(true);

    const audio = new Audio(station.url);
    audio.volume = isMuted ? 0 : volume / 100;
    audioRef.current = audio;

    audio.addEventListener("canplay", () => {
      setIsBuffering(false);
      audio.play();
      setIsPlaying(true);
    });

    audio.addEventListener("waiting", () => setIsBuffering(true));
    audio.addEventListener("playing", () => setIsBuffering(false));
    audio.addEventListener("error", () => {
      setIsBuffering(false);
      setIsPlaying(false);
    });

    audio.load();
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) {
      playStation(currentStation);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const nextStation = () => {
    const idx = radioStations.findIndex((s) => s.id === currentStation.id);
    const next = radioStations[(idx + 1) % radioStations.length];
    playStation(next);
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}
    >
      <AppHeader userName={profile?.full_name?.split(" ")[0] || "Jovem"} />

      <main className="py-4 sm:py-6">
        <ResponsiveContainer size="lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <RadioIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">
                Rádio de Louvores
              </h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground">
                Louvores 24h para edificar sua alma
              </p>
            </div>
          </motion.div>

          {/* Now Playing Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-5",
              "bg-gradient-to-br",
              currentStation.color
            )}
          >
            {/* Animated background waves */}
            <div className="absolute inset-0 opacity-10">
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Waves className="h-48 w-48" />
                </motion.div>
              )}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="h-4 w-4 opacity-80" />
                <span className="text-xs font-medium opacity-80">Tocando agora</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-1">
                {currentStation.name}
              </h2>
              <p className="text-sm opacity-80 mb-1">{currentStation.description}</p>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium">
                {currentStation.genre}
              </span>

              {/* Controls */}
              <div className="flex items-center justify-between mt-5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={() => toggleLike(currentStation.id)}
                >
                  <Heart
                    className={cn("h-5 w-5", liked.has(currentStation.id) && "fill-current text-red-300")}
                  />
                </Button>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm",
                      "shadow-lg hover:bg-white/35 transition-colors"
                    )}
                  >
                    {isBuffering ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
                    ) : isPlaying ? (
                      <Pause className="h-7 w-7 fill-white text-white" />
                    ) : (
                      <Play className="h-7 w-7 fill-white text-white ml-0.5" />
                    )}
                  </motion.button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={nextStation}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>

              {/* Volume Slider */}
              <div className="mt-4 flex items-center gap-3">
                <VolumeX className="h-3.5 w-3.5 opacity-60" />
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => {
                    setVolume(v);
                    if (v > 0) setIsMuted(false);
                  }}
                  className="flex-1 [&_[role=slider]]:bg-white [&_[data-orientation=horizontal]>span:first-child>span]:bg-white/60"
                />
                <Volume2 className="h-3.5 w-3.5 opacity-60" />
              </div>
            </div>
          </motion.div>

          {/* Visualizer bar when playing */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-center justify-center gap-1"
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-primary"
                    animate={{
                      height: [4, Math.random() * 24 + 8, 4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + Math.random() * 0.4,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Station List */}
          <div className="space-y-2.5">
            <h3 className="font-serif text-base font-semibold text-foreground px-1">Estações</h3>
            {radioStations.map((station, index) => (
              <motion.button
                key={station.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => playStation(station)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                  currentStation.id === station.id && isPlaying
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shrink-0",
                    station.color
                  )}
                >
                  {currentStation.id === station.id && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-5">
                      {[1, 2, 3].map((bar) => (
                        <motion.div
                          key={bar}
                          className="w-1 rounded-full bg-white"
                          animate={{ height: [4, 14, 4] }}
                          transition={{ repeat: Infinity, duration: 0.5 + bar * 0.15 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Music2 className="h-5 w-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{station.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{station.description}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>

          {/* Site da Obra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base font-semibold text-foreground">
                  Site Oficial da Obra
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Visite o site da Obra em Restauração para mais conteúdos, mensagens e informações sobre o ministério.
                </p>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => window.open("https://www.obraemrestauracao.org/", "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visitar Site
                </Button>
              </div>
            </div>
          </motion.div>
        </ResponsiveContainer>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Radio;
