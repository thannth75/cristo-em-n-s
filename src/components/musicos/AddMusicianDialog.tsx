import { useState, useEffect } from "react";
import { UserPlus, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
}

interface AddMusicianDialogProps {
  onMusicianAdded: () => void;
}

const INSTRUMENTS = [
  "Violão",
  "Guitarra",
  "Baixo",
  "Bateria",
  "Teclado",
  "Piano",
  "Voz",
  "Backing Vocal",
  "Saxofone",
  "Violino",
  "Flauta",
  "Cajon",
  "Percussão",
];

const AddMusicianDialog = ({ onMusicianAdded }: AddMusicianDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [customInstrument, setCustomInstrument] = useState("");
  const [skillLevel, setSkillLevel] = useState("intermediario");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    // Get profiles that are not already musicians
    const { data: existingMusicians } = await supabase
      .from("musicians")
      .select("user_id");

    const existingUserIds = (existingMusicians || []).map((m) => m.user_id);

    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name")
      .eq("is_approved", true)
      .order("full_name");

    // Filter out existing musicians
    const availableProfiles = (data || []).filter(
      (p) => !existingUserIds.includes(p.user_id)
    );

    setProfiles(availableProfiles);
  };

  const addInstrument = (instrument: string) => {
    if (!selectedInstruments.includes(instrument)) {
      setSelectedInstruments([...selectedInstruments, instrument]);
    }
  };

  const addCustomInstrument = () => {
    if (customInstrument.trim() && !selectedInstruments.includes(customInstrument.trim())) {
      setSelectedInstruments([...selectedInstruments, customInstrument.trim()]);
      setCustomInstrument("");
    }
  };

  const removeInstrument = (instrument: string) => {
    setSelectedInstruments(selectedInstruments.filter((i) => i !== instrument));
  };

  const handleCreate = async () => {
    if (!selectedUser) {
      toast({
        title: "Selecione um usuário",
        description: "Escolha quem será cadastrado como músico.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInstruments.length === 0) {
      toast({
        title: "Adicione instrumentos",
        description: "Selecione pelo menos um instrumento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("musicians").insert({
      user_id: selectedUser,
      instruments: selectedInstruments,
      skill_level: skillLevel,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Já cadastrado",
          description: "Este usuário já é músico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível cadastrar o músico.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Músico cadastrado! 🎵",
        description: "O músico foi adicionado à equipe.",
      });
      setIsOpen(false);
      setSelectedUser("");
      setSelectedInstruments([]);
      onMusicianAdded();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <UserPlus className="h-4 w-4 mr-2" />
          Músico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Cadastrar Músico</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <Label>Membro</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o membro" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {profiles.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Todos os membros já são músicos.
              </p>
            )}
          </div>

          {/* Skill Level */}
          <div>
            <Label>Nível</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instruments */}
          <div>
            <Label>Instrumentos</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {INSTRUMENTS.map((instrument) => (
                <Button
                  key={instrument}
                  variant={selectedInstruments.includes(instrument) ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    selectedInstruments.includes(instrument)
                      ? removeInstrument(instrument)
                      : addInstrument(instrument)
                  }
                  className="h-7 text-xs rounded-lg"
                >
                  {instrument}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Instrument */}
          <div className="flex gap-2">
            <Input
              value={customInstrument}
              onChange={(e) => setCustomInstrument(e.target.value)}
              placeholder="Outro instrumento..."
              className="rounded-xl flex-1"
              onKeyDown={(e) => e.key === "Enter" && addCustomInstrument()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addCustomInstrument}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Instruments */}
          {selectedInstruments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInstruments.map((instrument) => (
                <Badge
                  key={instrument}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {instrument}
                  <button
                    onClick={() => removeInstrument(instrument)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full rounded-xl"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Cadastrar Músico"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMusicianDialog;
