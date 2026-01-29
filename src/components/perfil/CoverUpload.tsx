import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface CoverUploadProps {
  userId: string;
  currentCoverUrl: string | null;
  onCoverChange: (url: string) => void;
}

export default function CoverUpload({ userId, currentCoverUrl, onCoverChange }: CoverUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter menos de 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/cover-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onCoverChange(publicUrl);
      toast({ title: "Capa atualizada! 🎉" });
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-4 right-4 bg-black/30 text-white hover:bg-black/50 rounded-full"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Camera className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Alterar capa</span>
          </>
        )}
      </Button>
    </>
  );
}