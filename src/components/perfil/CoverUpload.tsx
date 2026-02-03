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

    // Validate user
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem.", variant: "destructive" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter menos de 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/cover-${Date.now()}.${fileExt}`;

      // Try to delete previous cover if exists
      if (currentCoverUrl) {
        try {
          const urlParts = currentCoverUrl.split("/covers/");
          if (urlParts[1]) {
            await supabase.storage.from("covers").remove([decodeURIComponent(urlParts[1])]);
          }
        } catch {
          // Ignore delete errors - file might not exist
        }
      }

      // Upload to covers bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("covers")
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message || "Erro no upload");
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: urlWithCacheBuster })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error(updateError.message || "Erro ao atualizar perfil");
      }

      onCoverChange(urlWithCacheBuster);
      toast({ title: "Capa atualizada! 🎉" });
    } catch (error: any) {
      console.error("Error uploading cover:", error);
      toast({ 
        title: "Erro ao enviar imagem", 
        description: error?.message || "Verifique sua conexão e tente novamente.",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      // Reset input so user can select same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={isUploading || !userId}
        className="absolute bottom-4 right-4 rounded-full bg-background/80 text-foreground border border-border backdrop-blur-sm hover:bg-background/95 shadow-lg min-h-[44px] min-w-[44px] px-3"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Alterar capa</span>
          </>
        )}
      </Button>
    </>
  );
}
