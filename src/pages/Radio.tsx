import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio as RadioIcon, Play, Pause, Volume2, VolumeX,
  SkipForward, SkipBack, Music2, Heart, Globe,
  Headphones, Waves, Search, Plus, ListMusic, Shuffle,
  Repeat, Clock, Trash2, X, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Tipos ───
interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  url: string;
  cover: string;
  genre: string;
}

interface Playlist {
  id: string;
  name: string;
  emoji: string;
  songs: string[]; // song ids
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
  { id: "gospel-fm", name: "Gospel FM", description: "Músicas gospel 24h", url: "https://stream.zeno.fm/0r0xa792kwzuv", genre: "Gospel Contemporâneo", color: "from-amber-600 to-orange-700" },
  { id: "adoracao", name: "Rádio Adoração", description: "Louvores para seu momento com Deus", url: "https://stream.zeno.fm/dpnb0myk5e8uv", genre: "Adoração & Louvor", color: "from-violet-600 to-purple-800" },
  { id: "louvor-eterno", name: "Louvor Eterno", description: "Hinos clássicos e contemporâneos", url: "https://stream.zeno.fm/hb46bemirhruv", genre: "Hinos & Clássicos", color: "from-sky-600 to-blue-800" },
];

// ─── Catálogo de músicas gospel (streams gratuitos) ───
const songCatalog: Song[] = [
  { id: "s1", title: "Quão Grande És Tu", artist: "Harpa Cristã", album: "Hinos Clássicos", duration: "4:32", url: "https://stream.zeno.fm/yn65fsaurfhvv", cover: "🎵", genre: "Hinos" },
  { id: "s2", title: "Firmes na Fé", artist: "Adoração Central", album: "Adoração Viva", duration: "5:10", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🙏", genre: "Adoração" },
  { id: "s3", title: "Maravilhosa Graça", artist: "Louvor Eterno", album: "Graça Infinita", duration: "4:45", url: "https://stream.zeno.fm/hb46bemirhruv", cover: "✨", genre: "Louvor" },
  { id: "s4", title: "Castelo Forte", artist: "Harpa Cristã", album: "Hinos Reformados", duration: "3:58", url: "https://stream.zeno.fm/yn65fsaurfhvv", cover: "🏰", genre: "Hinos" },
  { id: "s5", title: "Adorarei", artist: "Ministério de Louvor", album: "Adoração Profunda", duration: "6:20", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "👑", genre: "Adoração" },
  { id: "s6", title: "Bondade de Deus", artist: "Isaías Saad", album: "Acústico", duration: "5:30", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "💛", genre: "Gospel" },
  { id: "s7", title: "Oceanos", artist: "Hillsong United", album: "Zion", duration: "5:55", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🌊", genre: "Adoração" },
  { id: "s8", title: "Nada Além do Sangue", artist: "Fernandinho", album: "Uma Nova História", duration: "4:48", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "✝️", genre: "Gospel" },
  { id: "s9", title: "A Ele a Glória", artist: "Diante do Trono", album: "Tu Reinas", duration: "4:15", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "👐", genre: "Adoração" },
  { id: "s10", title: "Lugar Secreto", artist: "Gabriela Rocha", album: "Jesus", duration: "5:02", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🕊️", genre: "Adoração" },
  { id: "s11", title: "Deus Está Aqui", artist: "Toque no Altar", album: "Deus de Promessas", duration: "3:45", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "🔥", genre: "Gospel" },
  { id: "s12", title: "Eu Navegarei", artist: "Harpa Cristã", album: "Hinos Clássicos Vol. 2", duration: "3:30", url: "https://stream.zeno.fm/yn65fsaurfhvv", cover: "⛵", genre: "Hinos" },
  { id: "s13", title: "Grande É o Senhor", artist: "Adhemar de Campos", album: "Adoração", duration: "4:10", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "⭐", genre: "Louvor" },
  { id: "s14", title: "Raridade", artist: "Anderson Freire", album: "Essência", duration: "4:22", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "💎", genre: "Gospel" },
  { id: "s15", title: "Pai Nosso", artist: "Ministério Zoe", album: "Oração", duration: "5:40", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🙌", genre: "Adoração" },
  { id: "s16", title: "Santo Espírito", artist: "Laura Souguellis", album: "Até Aqui", duration: "6:05", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🕯️", genre: "Adoração" },
  { id: "s17", title: "Grandioso És Tu", artist: "Soraya Moraes", album: "Shekinah", duration: "4:30", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "🌟", genre: "Adoração" },
  { id: "s18", title: "Ele Vem", artist: "Midian Lima", album: "Não Pare", duration: "3:55", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "☁️", genre: "Gospel" },
  { id: "s19", title: "Me Atraiu", artist: "Gabriela Rocha", album: "Jesus", duration: "4:40", url: "https://stream.zeno.fm/dpnb0myk5e8uv", cover: "💜", genre: "Adoração" },
  { id: "s20", title: "Sobre as Águas", artist: "Thalles Roberto", album: "Ide", duration: "5:15", url: "https://stream.zeno.fm/0r0xa792kwzuv", cover: "🌅", genre: "Gospel" },
];

// Playlists padrão
const defaultPlaylists: Playlist[] = [
  { id: "adoracao", name: "Adoração Profunda", emoji: "🙏", songs: ["s2", "s5", "s7", "s9", "s10", "s15", "s16", "s17", "s19"] },
  { id: "hinos", name: "Hinos Clássicos", emoji: "📖", songs: ["s1", "s4", "s12", "s13"] },
  { id: "gospel-hits", name: "Gospel Hits", emoji: "🔥", songs: ["s6", "s8", "s11", "s14", "s18", "s20"] },
  { id: "louvor", name: "Louvor & Celebração", emoji: "🎶", songs: ["s3", "s9", "s13", "s17"] },
];

type ViewMode = "home" | "stations" | "catalog" | "playlist" | "search";

const Radio = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Views
  const [view, setView] = useState<ViewMode>("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Player state
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
  const [showPlayer, setShowPlayer] = useState(false);

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("radio-playlists");
    return saved ? JSON.parse(saved) : defaultPlaylists;
  });
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Queue
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

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

  useEffect(() => {
    localStorage.setItem("radio-liked", JSON.stringify([...liked]));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("radio-playlists", JSON.stringify(playlists));
  }, [playlists]);

  // ─── Audio Controls ───
  const playAudioUrl = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsBuffering(true);
    const audio = new Audio(url);
    audio.volume = isMuted ? 0 : volume / 100;
    audioRef.current = audio;

    audio.addEventListener("canplay", () => { setIsBuffering(false); audio.play(); setIsPlaying(true); });
    audio.addEventListener("waiting", () => setIsBuffering(true));
    audio.addEventListener("playing", () => setIsBuffering(false));
    audio.addEventListener("error", () => { setIsBuffering(false); setIsPlaying(false); });
    audio.addEventListener("ended", () => { handleNext(); });
    audio.load();
  }, [isMuted, volume]);

  const playSong = useCallback((song: Song, songQueue?: Song[], startIndex?: number) => {
    setCurrentSong(song);
    setCurrentStation(null);
    setShowPlayer(true);
    if (songQueue) {
      setQueue(songQueue);
      setQueueIndex(startIndex ?? 0);
    }
    playAudioUrl(song.url);
  }, [playAudioUrl]);

  const playStation = useCallback((station: RadioStation) => {
    setCurrentStation(station);
    setCurrentSong(null);
    setShowPlayer(true);
    playAudioUrl(station.url);
  }, [playAudioUrl]);

  const togglePlay = () => {
    if (!audioRef.current?.src) {
      if (currentSong) playAudioUrl(currentSong.url);
      else if (currentStation) playAudioUrl(currentStation.url);
      return;
    }
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
    else { audioRef.current?.play(); setIsPlaying(true); }
  };

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (isRepeat) {
      nextIdx = queueIndex;
    } else {
      nextIdx = (queueIndex + 1) % queue.length;
    }
    setQueueIndex(nextIdx);
    const nextSong = queue[nextIdx];
    if (nextSong) {
      setCurrentSong(nextSong);
      setCurrentStation(null);
      playAudioUrl(nextSong.url);
    }
  }, [queue, queueIndex, isShuffle, isRepeat, playAudioUrl]);

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (prevSong) {
      setCurrentSong(prevSong);
      setCurrentStation(null);
      playAudioUrl(prevSong.url);
    }
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
      if (pl.id !== playlistId) return pl;
      if (pl.songs.includes(songId)) return pl;
      return { ...pl, songs: [...pl.songs, songId] };
    }));
    setShowAddToPlaylist(null);
    toast({ title: "Adicionado à playlist! ✅" });
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;
      return { ...pl, songs: pl.songs.filter(s => s !== songId) };
    }));
  };

  const playPlaylist = (playlist: Playlist) => {
    const songs = playlist.songs.map(id => songCatalog.find(s => s.id === id)).filter(Boolean) as Song[];
    if (songs.length === 0) return;
    playSong(songs[0], songs, 0);
  };

  const filteredSongs = searchQuery.trim()
    ? songCatalog.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : songCatalog;

  const likedSongs = songCatalog.filter(s => liked.has(s.id));

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Song Row Component ───
  const SongRow = ({ song, index, showAdd = true }: { song: Song; index: number; showAdd?: boolean }) => (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => playSong(song, filteredSongs, filteredSongs.indexOf(song))}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
        currentSong?.id === song.id
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-accent/50"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg shrink-0">
        {currentSong?.id === song.id && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3].map(bar => (
              <motion.div key={bar} className="w-0.5 rounded-full bg-primary"
                animate={{ height: [3, 12, 3] }}
                transition={{ repeat: Infinity, duration: 0.5 + bar * 0.15 }}
              />
            ))}
          </div>
        ) : (
          <span>{song.cover}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", currentSong?.id === song.id ? "text-primary" : "text-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{song.duration}</span>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
          className="p-1.5 rounded-full hover:bg-muted">
          <Heart className={cn("h-3.5 w-3.5", liked.has(song.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
        {showAdd && (
          <button onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(song.id); }}
            className="p-1.5 rounded-full hover:bg-muted">
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
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: "home" as ViewMode, label: "Início", icon: Music2 },
              { id: "catalog" as ViewMode, label: "Músicas", icon: ListMusic },
              { id: "stations" as ViewMode, label: "Rádios", icon: RadioIcon },
              { id: "search" as ViewMode, label: "Buscar", icon: Search },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setView(tab.id); setSelectedPlaylist(null); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  view === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ HOME VIEW ═══ */}
          {view === "home" && !selectedPlaylist && (
            <div className="space-y-6">
              {/* Hero */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/15 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                    <Headphones className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-serif text-lg font-bold text-foreground">Louvores</h1>
                    <p className="text-xs text-muted-foreground">Músicas, rádios e playlists</p>
                  </div>
                </div>
              </motion.div>

              {/* Curtidas */}
              {likedSongs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Curtidas
                    </h2>
                    <span className="text-xs text-muted-foreground">{likedSongs.length} músicas</span>
                  </div>
                  <div className="space-y-1">
                    {likedSongs.slice(0, 4).map((song, i) => <SongRow key={song.id} song={song} index={i} />)}
                  </div>
                </div>
              )}

              {/* Playlists */}
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
                    <motion.button key={pl.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
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

              {/* Rádios rápidas */}
              <div>
                <h2 className="font-serif text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                  <RadioIcon className="h-4 w-4 text-primary" /> Rádios ao Vivo
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {radioStations.map((station, i) => (
                    <motion.button key={station.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => playStation(station)}
                      className={cn(
                        "rounded-xl p-3 text-white text-left bg-gradient-to-br shadow-sm",
                        station.color,
                        currentStation?.id === station.id && isPlaying && "ring-2 ring-white/50"
                      )}>
                      <p className="font-semibold text-sm truncate">{station.name}</p>
                      <p className="text-[10px] opacity-80 truncate">{station.genre}</p>
                      {currentStation?.id === station.id && isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 mt-1">
                          {[1, 2, 3].map(bar => (
                            <motion.div key={bar} className="w-0.5 rounded-full bg-white"
                              animate={{ height: [2, 10, 2] }}
                              transition={{ repeat: Infinity, duration: 0.4 + bar * 0.1 }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sugestões */}
              <div>
                <h2 className="font-serif text-base font-semibold text-foreground mb-3">🎵 Sugestões para Você</h2>
                <div className="space-y-1">
                  {songCatalog.slice(0, 6).map((song, i) => <SongRow key={song.id} song={song} index={i} />)}
                </div>
                <Button variant="ghost" className="w-full mt-2 text-xs text-primary" onClick={() => setView("catalog")}>
                  Ver todas as músicas →
                </Button>
              </div>

              {/* Site da Obra */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-sm font-semibold text-foreground">Site Oficial da Obra</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2">Visite para mais conteúdos e mensagens.</p>
                    <Button size="sm" className="rounded-full gap-1 text-xs"
                      onClick={() => window.open("https://www.obraemrestauracao.org/", "_blank")}>
                      Visitar Site
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CATALOG VIEW ═══ */}
          {view === "catalog" && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Todas as Músicas</h2>
              <div className="space-y-1">
                {songCatalog.map((song, i) => <SongRow key={song.id} song={song} index={i} />)}
              </div>
            </div>
          )}

          {/* ═══ STATIONS VIEW ═══ */}
          {view === "stations" && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Estações ao Vivo</h2>
              {radioStations.map((station, i) => (
                <motion.button key={station.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => playStation(station)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                    currentStation?.id === station.id && isPlaying
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-accent/50"
                  )}>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shrink-0", station.color)}>
                    {currentStation?.id === station.id && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-5">
                        {[1, 2, 3].map(bar => (
                          <motion.div key={bar} className="w-1 rounded-full bg-white"
                            animate={{ height: [4, 14, 4] }}
                            transition={{ repeat: Infinity, duration: 0.5 + bar * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <RadioIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{station.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{station.description}</p>
                    <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {station.genre}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* ═══ SEARCH VIEW ═══ */}
          {view === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar música, artista ou gênero..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full" autoFocus />
              </div>
              {searchQuery.trim() && (
                <p className="text-xs text-muted-foreground">{filteredSongs.length} resultado{filteredSongs.length !== 1 ? "s" : ""}</p>
              )}
              <div className="space-y-1">
                {(searchQuery.trim() ? filteredSongs : songCatalog).map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ═══ PLAYLIST VIEW ═══ */}
          {view === "playlist" && selectedPlaylist && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView("home"); setSelectedPlaylist(null); }}
                  className="p-2 rounded-full hover:bg-muted">
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
                      <button onClick={() => removeFromPlaylist(selectedPlaylist.id, song.id)}
                        className="p-2 rounded-full hover:bg-destructive/10 shrink-0">
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
                  <p className="text-xs text-muted-foreground">Vá em Músicas e adicione com o botão +</p>
                </div>
              )}
            </div>
          )}
        </ResponsiveContainer>
      </main>

      {/* ═══ MINI PLAYER (Bottom) ═══ */}
      <AnimatePresence>
        {(currentSong || currentStation) && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-xl"
            style={{ bottom: "calc(4rem + max(0px, env(safe-area-inset-bottom, 0px)))" }}
          >
            <div className="mx-auto max-w-3xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                {/* Cover */}
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg shrink-0 text-lg",
                  currentStation ? `bg-gradient-to-br ${currentStation.color} text-white` : "bg-muted"
                )}>
                  {currentSong ? currentSong.cover : <Waves className="h-5 w-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {currentSong?.title || currentStation?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSong?.artist || currentStation?.genre}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  {currentSong && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={handlePrev}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    {isBuffering ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    )}
                  </motion.button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={handleNext}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Extra controls */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {currentSong && (
                    <>
                      <Button size="icon" variant="ghost" className={cn("h-7 w-7 rounded-full", isShuffle && "text-primary")}
                        onClick={() => setIsShuffle(!isShuffle)}>
                        <Shuffle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className={cn("h-7 w-7 rounded-full", isRepeat && "text-primary")}
                        onClick={() => setIsRepeat(!isRepeat)}>
                        <Repeat className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                {currentSong && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full"
                    onClick={() => toggleLike(currentSong.id)}>
                    <Heart className={cn("h-3.5 w-3.5", liked.has(currentSong.id) && "fill-red-500 text-red-500")} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Create Playlist Dialog ═══ */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da playlist" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createPlaylist()} />
            <Button className="w-full rounded-full" onClick={createPlaylist}>Criar Playlist</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Add to Playlist Dialog ═══ */}
      <Dialog open={!!showAddToPlaylist} onOpenChange={() => setShowAddToPlaylist(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Playlist</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {playlists.map(pl => (
                <button key={pl.id}
                  onClick={() => showAddToPlaylist && addToPlaylist(pl.id, showAddToPlaylist)}
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
