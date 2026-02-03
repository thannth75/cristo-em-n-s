import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  userName: string;
  onAvatarChange: (url: string) => void;
}

const AvatarUpload = ({ userId, currentAvatarUrl, userName, onAvatarChange }: AvatarUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate user
    if (!userId) {
      toast({ 
        title: "Erro", 
        description: "Usuário não identificado.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ 
        title: "Arquivo inválido", 
        description: "Por favor, selecione uma imagem.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ 
        title: "Arquivo muito grande", 
        description: "A imagem deve ter no máximo 2MB.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique file path
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
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
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error(updateError.message || "Erro ao atualizar perfil");
      }

      onAvatarChange(urlWithCacheBuster);
      toast({ 
        title: "Foto atualizada! 📸", 
        description: "Sua foto de perfil foi alterada." 
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Não foi possível atualizar a foto.", 
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
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="relative">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={userName}
            className="h-24 w-24 rounded-full object-cover border-4 border-card shadow-xl"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-xl">
            <span className="font-serif text-3xl font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading || !userId}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          style={{ touchAction: 'manipulation' }}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AvatarUpload;
