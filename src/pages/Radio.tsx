import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio as RadioIcon, Play, Pause, Volume2, VolumeX,
  SkipForward, SkipBack, Music2, Heart, Globe,
  Headphones, Waves, Search, Plus, ListMusic, Shuffle,
  Repeat, Trash2, ChevronDown, Timer, Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Tipos ───
interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
  cover: string;
  genre: string;
}

interface Playlist {
  id: string;
  name: string;
  emoji: string;
  songs: string[];
}

interface RadioStation {
  id: string;
  name: string;
  description: string;
  url: string;
  genre: string;
  color: string;
}

// ─── Estações de rádio ao vivo ───
const radioStations: RadioStation[] = [
  { id: "ipb", name: "Rádio Obra em Restauração", description: "Louvores e pregações", url: "https://stream.zeno.fm/yn65fsaurfhvv", genre: "Gospel / Adoração", color: "from-primary to-emerald-700" },
  { id: "gospel-fm", name: "Gospel FM 89.3", description: "A rádio da família", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/GOSPELFM_SC.mp3", genre: "Gospel Contemporâneo", color: "from-amber-600 to-orange-700" },
  { id: "adoracao", name: "Sara Brasil FM", description: "Louvores 24h", url: "https://stream.zeno.fm/dqc2f7p2punuv", genre: "Adoração & Louvor", color: "from-violet-600 to-purple-800" },
  { id: "louvor-eterno", name: "Melodia FM Gospel", description: "Hinos clássicos e adoração", url: "https://stream.zeno.fm/f3wvbbqmdg8uv", genre: "Hinos & Clássicos", color: "from-sky-600 to-blue-800" },
];

// ─── Catálogo de hinos (fontes públicas confiáveis) ───
const songCatalog: Song[] = [
  { id: "s1", title: "Quão Grande És Tu", artist: "Harpa Cristã", duration: "4:32", url: "https://cdn.pixabay.com/audio/2024/11/29/audio_4956b4edd1.mp3", cover: "🎵", genre: "Hinos" },
  { id: "s2", title: "Maravilhosa Graça", artist: "Amazing Grace", duration: "4:10", url: "https://cdn.pixabay.com/audio/2024/09/10/audio_6e4836e06a.mp3", cover: "✨", genre: "Hinos" },
  { id: "s3", title: "Castelo Forte", artist: "Martinho Lutero", duration: "3:58", url: "https://cdn.pixabay.com/audio/2024/10/08/audio_8fba161079.mp3", cover: "🏰", genre: "Hinos" },
  { id: "s4", title: "Santo, Santo, Santo", artist: "Hino Clássico", duration: "3:45", url: "https://cdn.pixabay.com/audio/2023/10/26/audio_b6661c27ef.mp3", cover: "👑", genre: "Hinos" },
  { id: "s5", title: "Deus é Amor", artist: "Hino Congregacional", duration: "3:30", url: "https://cdn.pixabay.com/audio/2023/09/04/audio_0f02229a85.mp3", cover: "❤️", genre: "Hinos" },
  { id: "s6", title: "Oh Que Amor", artist: "Hino de Adoração", duration: "4:15", url: "https://cdn.pixabay.com/audio/2024/02/15/audio_ef94891852.mp3", cover: "🙏", genre: "Adoração" },
  { id: "s7", title: "Glória ao Salvador", artist: "Hino Tradicional", duration: "3:55", url: "https://cdn.pixabay.com/audio/2024/06/06/audio_a6e7b5dcf0.mp3", cover: "⭐", genre: "Louvor" },
  { id: "s8", title: "Vem, Espírito Santo", artist: "Hino de Pentecostes", duration: "5:20", url: "https://cdn.pixabay.com/audio/2024/04/16/audio_82d60e6879.mp3", cover: "🕊️", genre: "Adoração" },
  { id: "s9", title: "Jesus Me Guia", artist: "Hino de Confiança", duration: "4:00", url: "https://cdn.pixabay.com/audio/2024/08/02/audio_f2cfb7293b.mp3", cover: "🌟", genre: "Hinos" },
  { id: "s10", title: "Oh Profundidade", artist: "Hino de Louvor", duration: "3:40", url: "https://cdn.pixabay.com/audio/2024/07/23/audio_71ee88eae5.mp3", cover: "🌊", genre: "Adoração" },
  { id: "s11", title: "Bendito Redentor", artist: "Harpa Cristã", duration: "4:25", url: "https://cdn.pixabay.com/audio/2024/03/08/audio_2c0c6c968b.mp3", cover: "✝️", genre: "Hinos" },
  { id: "s12", title: "Firme Fundamento", artist: "Hino Reformado", duration: "3:50", url: "https://cdn.pixabay.com/audio/2023/11/16/audio_e3e5668116.mp3", cover: "🪨", genre: "Hinos" },
  { id: "s13", title: "A Deus Toda Glória", artist: "Fanny Crosby", duration: "3:35", url: "https://cdn.pixabay.com/audio/2024/05/17/audio_1dbea4da2a.mp3", cover: "🎶", genre: "Louvor" },
  { id: "s14", title: "Vem, Rei dos Reis", artist: "Adoração Clássica", duration: "4:45", url: "https://cdn.pixabay.com/audio/2024/01/18/audio_97c9ac6fea.mp3", cover: "👐", genre: "Adoração" },
  { id: "s15", title: "Eu Navegarei", artist: "Hino de Fé", duration: "3:30", url: "https://cdn.pixabay.com/audio/2024/12/03/audio_ad891c44f7.mp3", cover: "⛵", genre: "Hinos" },
  { id: "s16", title: "Cristo, Rocha Eterna", artist: "Hino Tradicional", duration: "4:10", url: "https://cdn.pixabay.com/audio/2024/09/22/audio_c399ca91f2.mp3", cover: "💎", genre: "Hinos" },
  { id: "s17", title: "Grande É a Fidelidade", artist: "Thomas Chisholm", duration: "5:00", url: "https://cdn.pixabay.com/audio/2024/08/19/audio_01d56c9fd9.mp3", cover: "🌅", genre: "Adoração" },
  { id: "s18", title: "Aleluia, Louvor ao Senhor", artist: "Cântico de Adoração", duration: "3:20", url: "https://cdn.pixabay.com/audio/2024/11/08/audio_7ce1a781e4.mp3", cover: "🔥", genre: "Louvor" },
  { id: "s19", title: "Doce é Orar", artist: "Hino Devocional", duration: "4:30", url: "https://cdn.pixabay.com/audio/2024/10/20/audio_3c5a5a2a63.mp3", cover: "💜", genre: "Adoração" },
  { id: "s20", title: "Ao Deus de Abraão", artist: "Hino Patriarcal", duration: "3:45", url: "https://cdn.pixabay.com/audio/2024/06/28/audio_e6d1f9a78b.mp3", cover: "☁️", genre: "Hinos" },
];

const defaultPlaylists: Playlist[] = [
  { id: "adoracao", name: "Adoração Profunda", emoji: "🙏", songs: ["s6", "s8", "s10", "s14", "s17", "s19"] },
  { id: "hinos", name: "Hinos Clássicos", emoji: "📖", songs: ["s1", "s3", "s4", "s5", "s9", "s11", "s12", "s15", "s16", "s20"] },
  { id: "louvor", name: "Louvor & Celebração", emoji: "🔥", songs: ["s2", "s7", "s13", "s18"] },
];

type ViewMode = "home" | "stations" | "catalog" | "playlist" | "search";

const Radio = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [view, setView] = useState<ViewMode>("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("radio-liked");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("radio-playlists-v2");
    return saved ? JSON.parse(saved) : defaultPlaylists;
  });
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimeLeft, setSleepTimeLeft] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  useEffect(() => { localStorage.setItem("radio-liked", JSON.stringify([...liked])); }, [liked]);
  useEffect(() => { localStorage.setItem("radio-playlists-v2", JSON.stringify(playlists)); }, [playlists]);

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

  const playAudioUrl = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setIsBuffering(true);

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : volume / 100;
    audioRef.current = audio;

    const onCanPlay = () => {
      setIsBuffering(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => { setIsBuffering(false); setIsPlaying(true); };
    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      toast({ title: "Erro de reprodução", description: "Não foi possível carregar o áudio. Tente outra música ou rádio.", variant: "destructive" });
    };
    const onEnded = () => handleNextRef.current();

    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError, { once: true });
    audio.addEventListener("ended", onEnded);

    audio.src = url;
    audio.load();
  }, [isMuted, volume, toast]);

  const handleNextRef = useRef(() => {});

  const playSong = useCallback((song: Song, songQueue?: Song[], startIndex?: number) => {
    setCurrentSong(song);
    setCurrentStation(null);
    if (songQueue) { setQueue(songQueue); setQueueIndex(startIndex ?? 0); }
    playAudioUrl(song.url);
  }, [playAudioUrl]);

  const playStation = useCallback((station: RadioStation) => {
    setCurrentStation(station);
    setCurrentSong(null);
    setQueue([]);
    playAudioUrl(station.url);
  }, [playAudioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) {
      if (currentSong) playAudioUrl(currentSong.url);
      else if (currentStation) playAudioUrl(currentStation.url);
      return;
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (isShuffle) nextIdx = Math.floor(Math.random() * queue.length);
    else if (isRepeat) nextIdx = queueIndex;
    else nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    const next = queue[nextIdx];
    if (next) { setCurrentSong(next); setCurrentStation(null); playAudioUrl(next.url); }
  }, [queue, queueIndex, isShuffle, isRepeat, playAudioUrl]);

  // Keep handleNextRef current
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    const prev = queue[prevIdx];
    if (prev) { setCurrentSong(prev); setCurrentStation(null); playAudioUrl(prev.url); }
  };

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const pl: Playlist = { id: `custom-${Date.now()}`, name: newPlaylistName.trim(), emoji: "🎵", songs: [] };
    setPlaylists(prev => [...prev, pl]);
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
    toast({ title: "Playlist criada! 🎶", description: pl.name });
  };

  const addToPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId || pl.songs.includes(songId)) return pl;
      return { ...pl, songs: [...pl.songs, songId] };
    }));
    setShowAddToPlaylist(null);
    toast({ title: "Adicionado à playlist! ✅" });
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => pl.id !== playlistId ? pl : { ...pl, songs: pl.songs.filter(s => s !== songId) }));
  };

  const playPlaylist = (playlist: Playlist) => {
    const songs = playlist.songs.map(id => songCatalog.find(s => s.id === id)).filter(Boolean) as Song[];
    if (songs.length === 0) return;
    playSong(songs[0], songs, 0);
  };

  const filteredSongs = searchQuery.trim()
    ? songCatalog.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    : songCatalog;

  const likedSongs = songCatalog.filter(s => liked.has(s.id));

  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute("src"); } }; }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const SongRow = ({ song, index, showAdd = true }: { song: Song; index: number; showAdd?: boolean }) => (
    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
      onClick={() => playSong(song, filteredSongs, filteredSongs.indexOf(song))}
      className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
        currentSong?.id === song.id ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50")}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg shrink-0">
        {currentSong?.id === song.id && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3].map(bar => (
              <motion.div key={bar} className="w-0.5 rounded-full bg-primary"
                animate={{ height: [3, 12, 3] }} transition={{ repeat: Infinity, duration: 0.5 + bar * 0.15 }} />
            ))}
          </div>
        ) : <span>{song.cover}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", currentSong?.id === song.id ? "text-primary" : "text-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{song.duration}</span>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }} className="p-1.5 rounded-full hover:bg-muted">
          <Heart className={cn("h-3.5 w-3.5", liked.has(song.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
        {showAdd && (
          <button onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(song.id); }} className="p-1.5 rounded-full hover:bg-muted">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-background"
      style={{ paddingBottom: currentSong || currentStation ? "calc(10rem + max(1rem, env(safe-area-inset-bottom, 16px)))" : "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}>
      <AppHeader userName={profile?.full_name?.split(" ")[0] || "Jovem"} />

      <main className="py-4 sm:py-6">
        <ResponsiveContainer size="lg">
          {/* Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { id: "home" as ViewMode, label: "Início", icon: Music2 },
              { id: "catalog" as ViewMode, label: "Músicas", icon: ListMusic },
              { id: "stations" as ViewMode, label: "Rádios", icon: RadioIcon },
              { id: "search" as ViewMode, label: "Buscar", icon: Search },
            ]).map(tab => (
              <button key={tab.id} onClick={() => { setView(tab.id); setSelectedPlaylist(null); }}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  view === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* HOME */}
          {view === "home" && !selectedPlaylist && (
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/15 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                    <Headphones className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-serif text-lg font-bold text-foreground">Louvores</h1>
                    <p className="text-xs text-muted-foreground">Hinos cristãos, rádios ao vivo e playlists</p>
                  </div>
                </div>
              </motion.div>

              {likedSongs.length > 0 && (
                <div>
                  <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Curtidas
                  </h2>
                  <div className="space-y-1">{likedSongs.slice(0, 4).map((s, i) => <SongRow key={s.id} song={s} index={i} />)}</div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
                    <ListMusic className="h-4 w-4 text-primary" /> Suas Playlists
                  </h2>
                  <Button size="sm" variant="ghost" className="rounded-full text-xs gap-1" onClick={() => setShowCreatePlaylist(true)}>
                    <Plus className="h-3.5 w-3.5" /> Nova
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {playlists.map((pl, i) => (
                    <motion.button key={pl.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      onClick={() => { setSelectedPlaylist(pl); setView("playlist"); }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left">
                      <span className="text-2xl">{pl.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{pl.name}</p>
                        <p className="text-[10px] text-muted-foreground">{pl.songs.length} músicas</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                  <RadioIcon className="h-4 w-4 text-primary" /> Rádios ao Vivo
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {radioStations.map((station, i) => (
                    <motion.button key={station.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => playStation(station)}
                      className={cn("rounded-xl p-3 text-white text-left bg-gradient-to-br shadow-sm", station.color,
                        currentStation?.id === station.id && isPlaying && "ring-2 ring-white/50")}>
                      <p className="font-semibold text-sm truncate">{station.name}</p>
                      <p className="text-[10px] opacity-80 truncate">{station.genre}</p>
                      {currentStation?.id === station.id && isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 mt-1">
                          {[1, 2, 3].map(bar => (
                            <motion.div key={bar} className="w-0.5 rounded-full bg-white"
                              animate={{ height: [2, 10, 2] }} transition={{ repeat: Infinity, duration: 0.4 + bar * 0.1 }} />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-base font-semibold text-foreground mb-3">🎵 Hinos para Você</h2>
                <div className="space-y-1">{songCatalog.slice(0, 6).map((s, i) => <SongRow key={s.id} song={s} index={i} />)}</div>
                <Button variant="ghost" className="w-full mt-2 text-xs text-primary" onClick={() => setView("catalog")}>Ver todas →</Button>
              </div>
            </div>
          )}

          {view === "catalog" && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Todas as Músicas</h2>
              <div className="space-y-1">{songCatalog.map((s, i) => <SongRow key={s.id} song={s} index={i} />)}</div>
            </div>
          )}

          {view === "stations" && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Estações ao Vivo</h2>
              {radioStations.map((station, i) => (
                <motion.button key={station.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => playStation(station)}
                  className={cn("w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                    currentStation?.id === station.id && isPlaying ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-accent/50")}>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shrink-0", station.color)}>
                    {currentStation?.id === station.id && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-5">
                        {[1, 2, 3].map(bar => (
                          <motion.div key={bar} className="w-1 rounded-full bg-white"
                            animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.5 + bar * 0.15 }} />
                        ))}
                      </div>
                    ) : <RadioIcon className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{station.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{station.description}</p>
                    <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{station.genre}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {view === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar música ou artista..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full" autoFocus />
              </div>
              {searchQuery.trim() && <p className="text-xs text-muted-foreground">{filteredSongs.length} resultado{filteredSongs.length !== 1 ? "s" : ""}</p>}
              <div className="space-y-1">{(searchQuery.trim() ? filteredSongs : songCatalog).map((s, i) => <SongRow key={s.id} song={s} index={i} />)}</div>
            </div>
          )}

          {view === "playlist" && selectedPlaylist && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView("home"); setSelectedPlaylist(null); }} className="p-2 rounded-full hover:bg-muted">
                  <ChevronDown className="h-5 w-5 text-muted-foreground rotate-90" />
                </button>
                <span className="text-3xl">{selectedPlaylist.emoji}</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">{selectedPlaylist.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedPlaylist.songs.length} músicas</p>
                </div>
              </div>
              {selectedPlaylist.songs.length > 0 && (
                <Button size="sm" className="rounded-full gap-1.5" onClick={() => playPlaylist(selectedPlaylist)}>
                  <Play className="h-3.5 w-3.5 fill-current" /> Tocar todas
                </Button>
              )}
              <div className="space-y-1">
                {selectedPlaylist.songs.map((songId, i) => {
                  const song = songCatalog.find(s => s.id === songId);
                  if (!song) return null;
                  return (
                    <div key={song.id} className="flex items-center gap-1">
                      <div className="flex-1"><SongRow song={song} index={i} showAdd={false} /></div>
                      <button onClick={() => removeFromPlaylist(selectedPlaylist.id, song.id)} className="p-2 rounded-full hover:bg-destructive/10 shrink-0">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {selectedPlaylist.songs.length === 0 && (
                <div className="text-center py-10">
                  <ListMusic className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Playlist vazia</p>
                </div>
              )}
            </div>
          )}
        </ResponsiveContainer>
      </main>

      {/* Mini Player */}
      <AnimatePresence>
        {(currentSong || currentStation) && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-xl"
            style={{ bottom: "calc(4rem + max(0px, env(safe-area-inset-bottom, 0px)))" }}>
            <div className="mx-auto max-w-3xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg shrink-0 text-lg",
                  currentStation ? `bg-gradient-to-br ${currentStation.color} text-white` : "bg-muted")}>
                  {currentSong ? currentSong.cover : <Waves className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{currentSong?.title || currentStation?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentSong?.artist || currentStation?.genre}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {currentSong && <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={handlePrev}><SkipBack className="h-4 w-4" /></Button>}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    {isBuffering ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      : isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                  </motion.button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={handleNext}><SkipForward className="h-4 w-4" /></Button>
                </div>
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {currentSong && (
                    <>
                      <Button size="icon" variant="ghost" className={cn("h-7 w-7 rounded-full", isShuffle && "text-primary")} onClick={() => setIsShuffle(!isShuffle)}>
                        <Shuffle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className={cn("h-7 w-7 rounded-full", isRepeat && "text-primary")} onClick={() => setIsRepeat(!isRepeat)}>
                        <Repeat className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {currentSong && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => toggleLike(currentSong.id)}>
                    <Heart className={cn("h-3.5 w-3.5", liked.has(currentSong.id) && "fill-red-500 text-red-500")} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Playlist</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da playlist" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createPlaylist()} />
            <Button className="w-full rounded-full" onClick={createPlaylist}>Criar Playlist</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddToPlaylist} onOpenChange={() => setShowAddToPlaylist(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar à Playlist</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {playlists.map(pl => (
                <button key={pl.id} onClick={() => showAddToPlaylist && addToPlaylist(pl.id, showAddToPlaylist)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 text-left transition-colors">
                  <span className="text-xl">{pl.emoji}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">{pl.songs.length} músicas</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Radio;
