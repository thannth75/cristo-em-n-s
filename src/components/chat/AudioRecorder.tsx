import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  userId: string;
  onSendAudio: (audioUrl: string, duration: number) => void;
}

export default function AudioRecorder({ userId, onSendAudio }: AudioRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setDuration(0);
      startTimer();
    } catch {
      toast({ title: "Permissão de microfone necessária", description: "Habilite o microfone nas configurações do navegador.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setIsPaused(false);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    const fileName = `${userId}/${Date.now()}.webm`;
    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(fileName, audioBlob, { contentType: "audio/webm", cacheControl: "3600" });

    if (error) {
      toast({ title: "Erro ao enviar áudio", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    onSendAudio(urlData.publicUrl, duration);
    discardRecording();
    setIsUploading(false);
  };

  // Preview mode (recorded, not yet sent)
  if (audioBlob && audioUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-card rounded-full px-3 py-2 border border-border shadow-sm"
      >
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={discardRecording}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={togglePlayback}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" style={{ width: "100%" }}
              animate={isPlaying ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }} />
          </div>
          <span className="text-xs text-muted-foreground font-mono">{formatDuration(duration)}</span>
        </div>
        <Button size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={sendAudio} disabled={isUploading}>
          <Send className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  // Recording mode
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-destructive/10 rounded-full px-3 py-2 border border-destructive/20"
      >
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="h-3 w-3 rounded-full bg-destructive shrink-0" />
        <span className="text-sm font-medium text-destructive flex-1">Gravando</span>
        <span className="text-xs font-mono text-muted-foreground">{formatDuration(duration)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={isPaused ? resumeRecording : pauseRecording}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => { stopRecording(); discardRecording(); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" className="h-9 w-9 rounded-full shrink-0 bg-primary" onClick={stopRecording}>
          <Square className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  // Idle - just the mic button
  return (
    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
      onClick={startRecording}>
      <Mic className="h-5 w-5" />
    </Button>
  );
}

// Audio message player component for chat bubbles
export function AudioMessagePlayer({ audioUrl, duration, isOwn }: { audioUrl: string; duration?: number; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setProgress(audio.currentTime / (audio.duration || 1) * 100);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    const onLoaded = () => { if (!duration) setAudioDuration(Math.round(audio.duration)); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => { audio.removeEventListener("timeupdate", onTimeUpdate); audio.removeEventListener("ended", onEnded); audio.removeEventListener("loadedmetadata", onLoaded); };
  }, [duration]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button onClick={toggle} className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isOwn ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
        {isPlaying ? <Pause className={`h-4 w-4 ${isOwn ? "text-primary-foreground" : "text-primary"}`} /> : <Play className={`h-4 w-4 ${isOwn ? "text-primary-foreground" : "text-primary"}`} />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`h-1 rounded-full overflow-hidden ${isOwn ? "bg-primary-foreground/20" : "bg-muted"}`}>
          <div className={`h-full rounded-full transition-all ${isOwn ? "bg-primary-foreground/70" : "bg-primary"}`} style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[10px] font-mono ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {formatDur(audioDuration)}
        </span>
      </div>
    </div>
  );
}
