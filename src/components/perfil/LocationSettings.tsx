import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSettingsProps {
  userId: string;
  currentState: string | null;
  currentCity: string | null;
  onUpdate: () => void;
}

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const LocationSettings = ({ userId, currentState, currentCity, onUpdate }: LocationSettingsProps) => {
  const { toast } = useToast();
  const [state, setState] = useState(currentState || "");
  const [city, setCity] = useState(currentCity || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setState(currentState || "");
    setCity(currentCity || "");
  }, [currentState, currentCity]);

  const handleSave = async () => {
    if (!state || !city.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o estado e informe a cidade.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        state,
        city: city.trim(),
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a localização.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Localização atualizada! 📍",
        description: `${city}, ${state}`,
      });
      onUpdate();
    }

    setIsSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-4 shadow-md space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Localização</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Informe sua cidade para conectar com jovens da sua região.
      </p>

      <div className="space-y-3">
        <div>
          <Label>Estado</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Cidade</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Carlos"
            className="rounded-xl"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl"
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Salvar Localização
            </>
          )}
        </Button>
      </div>

      {currentState && currentCity && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Localização atual: {currentCity}, {currentState}</span>
        </div>
      )}
    </motion.div>
  );
};

export default LocationSettings;
