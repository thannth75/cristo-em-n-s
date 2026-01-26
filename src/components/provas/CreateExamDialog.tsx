import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateExamDialog({ open, onOpenChange, onSuccess }: CreateExamDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    exam_date: new Date().toISOString().split("T")[0],
    max_score: "10",
    exam_type: "prova",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("exams").insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        exam_date: formData.exam_date,
        max_score: parseFloat(formData.max_score),
        exam_type: formData.exam_type,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Prova criada com sucesso",
      });

      setFormData({
        title: "",
        description: "",
        exam_date: new Date().toISOString().split("T")[0],
        max_score: "10",
        exam_type: "prova",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar prova:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a prova",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Prova/Avaliação</DialogTitle>
          <DialogDescription>
            Crie uma nova avaliação para lançar notas dos jovens
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Prova de Romanos"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição da avaliação..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam_date">Data</Label>
              <Input
                id="exam_date"
                type="date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score">Nota Máxima</Label>
              <Input
                id="max_score"
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam_type">Tipo</Label>
            <Select
              value={formData.exam_type}
              onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prova">Prova</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="participacao">Participação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Prova
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
