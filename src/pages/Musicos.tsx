import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Calendar, CheckCircle, Clock, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface MusicScale {
  id: string;
  event_id: string;
  notes: string | null;
  events: {
    title: string;
    event_date: string;
    start_time: string;
  };
}

interface Song {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
}

const Musicos = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [scales, setScales] = useState<MusicScale[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    key: "C",
    youtube_url: "",
  });

  const canManage = isAdmin || isLeader;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved) {
      fetchData();
    }
  }, [isApproved]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [scalesRes, songsRes] = await Promise.all([
      supabase
        .from("music_scales")
        .select(`
          id,
          event_id,
          notes,
          events (
            title,
            event_date,
            start_time
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("songs")
        .select("id, title, artist, key")
        .order("title"),
    ]);

    setScales((scalesRes.data as any) || []);
    setSongs(songsRes.data || []);
    setIsLoading(false);
  };

  const handleAddSong = async () => {
    if (!newSong.title) {
      toast({
        title: "Título obrigatório",
        description: "Informe o nome da música.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("songs").insert({
      ...newSong,
      created_by: user?.id,
      artist: newSong.artist || null,
      youtube_url: newSong.youtube_url || null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a música.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Música adicionada! 🎵",
        description: "A música foi incluída no repertório.",
      });
      setIsSongDialogOpen(false);
      setNewSong({ title: "", artist: "", key: "C", youtube_url: "" });
      fetchData();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Músicos & Escalas
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize sua participação musical
            </p>
          </div>

          {canManage && (
            <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-xl shadow-lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Nova Música</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newSong.title}
                      onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                      placeholder="Nome da música"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Artista/Ministério</Label>
                    <Input
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      placeholder="Ex: Hillsong"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Tom</Label>
                    <Select
                      value={newSong.key}
                      onValueChange={(value) => setNewSong({ ...newSong, key: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
                          (key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Link YouTube (opcional)</Label>
                    <Input
                      value={newSong.youtube_url}
                      onChange={(e) => setNewSong({ ...newSong, youtube_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={handleAddSong} className="w-full rounded-xl">
                    Adicionar Música
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Card Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Music className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Repertório</p>
              <h3 className="font-serif text-lg font-semibold">
                {songs.length} música{songs.length !== 1 && "s"}
              </h3>
              <p className="text-sm opacity-80">
                {scales.length} escala{scales.length !== 1 && "s"} ativa{scales.length !== 1 && "s"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Escalas */}
        <div className="mb-6">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Escalas Recentes
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : scales.length === 0 ? (
            <div className="rounded-2xl bg-card p-6 text-center shadow-md">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma escala criada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scales.map((scale, index) => (
                <motion.div
                  key={scale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {scale.events?.title || "Evento"}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {scale.events?.event_date
                            ? formatDate(scale.events.event_date)
                            : "Data não definida"}
                          , {scale.events?.start_time?.slice(0, 5) || ""}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Ativa
                    </Badge>
                  </div>
                  {scale.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{scale.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Repertório */}
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Repertório
          </h2>
          {songs.length === 0 ? (
            <div className="rounded-2xl bg-card p-6 text-center shadow-md">
              <Music className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma música cadastrada.</p>
              {canManage && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique no + para adicionar.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {songs.slice(0, 8).map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{song.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist || "Artista desconhecido"}
                    </p>
                  </div>
                  {song.key && (
                    <Badge variant="secondary" className="text-xs">
                      {song.key}
                    </Badge>
                  )}
                </motion.div>
              ))}
              {songs.length > 8 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  +{songs.length - 8} música(s)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Versículo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Quando vos reunis, cada um pode ter um salmo, um ensino, uma revelação..."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— 1 Coríntios 14:26</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Musicos;
