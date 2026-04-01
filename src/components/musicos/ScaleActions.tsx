import { useState } from "react";
import { Trash2, Edit, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScaleActionsProps {
  scaleId: string;
  currentNotes: string | null;
  onUpdated: () => void;
}

const ScaleActions = ({ scaleId, currentNotes, onUpdated }: ScaleActionsProps) => {
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from("music_scales")
      .update({ notes: notes || null })
      .eq("id", scaleId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    } else {
      toast({ title: "Escala atualizada! ✅" });
      setIsEditOpen(false);
      onUpdated();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    // Delete scale musicians first
    await supabase.from("scale_musicians").delete().eq("scale_id", scaleId);
    const { error } = await supabase.from("music_scales").delete().eq("id", scaleId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    } else {
      toast({ title: "Escala removida! 🗑️" });
      setIsDeleteOpen(false);
      onUpdated();
    }
    setIsLoading(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setNotes(currentNotes || ""); setIsEditOpen(true); }}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações da escala..."
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleEdit} disabled={isLoading} className="w-full rounded-xl">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A escala e todos os músicos escalados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground">
              {isLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScaleActions;
