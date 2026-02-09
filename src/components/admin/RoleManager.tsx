import { useState } from "react";
import { Shield, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoleManagerProps {
  targetUserId: string;
  currentRole: string;
  adminUserId: string;
  onRoleChange: () => void;
}

const roles = [
  { value: "jovem", label: "Jovem", description: "Acesso a estudos, provas e comunidade" },
  { value: "membro", label: "Membro", description: "Comunidade e devocionais" },
  { value: "musico", label: "Músico", description: "Área de músicos e comunidade" },
  { value: "lider", label: "Líder", description: "Gerencia sua cidade" },
  { value: "admin", label: "Administrador", description: "Acesso total ao sistema" },
];

const RoleManager = ({ targetUserId, currentRole, adminUserId, onRoleChange }: RoleManagerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    
    setIsLoading(true);
    
    try {
      // First, delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId);

      // Then insert new role
      const { error } = await supabase.from("user_roles").insert([{
        user_id: targetUserId,
        role: newRole as "jovem" | "lider" | "admin" | "membro" | "musico",
        assigned_by: adminUserId,
      }]);

      if (error) throw error;

      toast({
        title: "Permissão alterada! ✅",
        description: `O usuário agora é ${roles.find(r => r.value === newRole)?.label}.`,
      });
      
      onRoleChange();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a permissão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleData = roles.find(r => r.value === currentRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="rounded-xl"
        >
          <Shield className="mr-2 h-4 w-4" />
          {currentRoleData?.label || "Jovem"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-medium">{role.label}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
            {currentRole === role.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleManager;
