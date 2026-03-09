import { useState, useRef } from "react";
import { FileText, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  userId: string;
  onSendFile: (fileUrl: string, fileName: string, fileSize: number) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const FILE_ICONS: Record<string, string> = {
  pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
  ppt: "📑", pptx: "📑", txt: "📃", zip: "📦", rar: "📦",
  mp3: "🎵", wav: "🎵", mp4: "🎬", default: "📎",
};

export function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploader({ userId, onSendFile }: FileUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 20MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split(".").pop() || "bin";
    const safeName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(safeName, file, { contentType: file.type || "application/octet-stream", cacheControl: "3600" });

    if (error) {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    onSendFile(urlData.publicUrl, file.name, file.size);
    setIsUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp3,.wav,.mp4,.jpg,.jpeg,.png,.gif,.webp" />
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
        onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </Button>
    </>
  );
}

// File message bubble for chat
export function FileMessageBubble({ fileName, fileUrl, fileSize, isOwn }: { fileName: string; fileUrl: string; fileSize?: number; isOwn: boolean }) {
  return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${isOwn ? "hover:bg-primary-foreground/10" : "hover:bg-muted"}`}>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${isOwn ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
        {getFileIcon(fileName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? "text-primary-foreground" : "text-foreground"}`}>{fileName}</p>
        {fileSize && <p className={`text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatFileSize(fileSize)}</p>}
      </div>
      <FileText className={`h-4 w-4 shrink-0 ${isOwn ? "text-primary-foreground/50" : "text-muted-foreground"}`} />
    </a>
  );
}
