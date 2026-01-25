import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onAvatarChange(publicUrl);
      toast({ 
        title: "Foto atualizada! 📸", 
        description: "Sua foto de perfil foi alterada." 
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível atualizar a foto.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
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
