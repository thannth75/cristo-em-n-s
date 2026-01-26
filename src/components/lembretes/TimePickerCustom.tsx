import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimePickerCustomProps {
  value: string;
  onChange: (time: string) => void;
}

const TimePickerCustom = ({ value, onChange }: TimePickerCustomProps) => {
  const [hours, setHours] = useState(6);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setHours(h);
      setMinutes(m);
    }
  }, [value]);

  const updateTime = (newHours: number, newMinutes: number) => {
    const h = newHours.toString().padStart(2, "0");
    const m = newMinutes.toString().padStart(2, "0");
    onChange(`${h}:${m}`);
  };

  const incrementHours = () => {
    const newHours = (hours + 1) % 24;
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = hours === 0 ? 23 : hours - 1;
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = (minutes + 5) % 60;
    setMinutes(newMinutes);
    if (newMinutes === 0 && minutes === 55) {
      const newHours = (hours + 1) % 24;
      setHours(newHours);
      updateTime(newHours, newMinutes);
    } else {
      updateTime(hours, newMinutes);
    }
  };

  const decrementMinutes = () => {
    const newMinutes = minutes < 5 ? 55 : minutes - 5;
    setMinutes(newMinutes);
    if (newMinutes === 55 && minutes < 5) {
      const newHours = hours === 0 ? 23 : hours - 1;
      setHours(newHours);
      updateTime(newHours, newMinutes);
    } else {
      updateTime(hours, newMinutes);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Hours */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={incrementHours}
          className="h-10 w-10 rounded-xl hover:bg-primary/10"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-3xl font-bold text-primary">
            {hours.toString().padStart(2, "0")}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={decrementHours}
          className="h-10 w-10 rounded-xl hover:bg-primary/10"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
        <span className="text-xs text-muted-foreground mt-1">Horas</span>
      </div>

      {/* Separator */}
      <div className="text-3xl font-bold text-primary mb-6">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={incrementMinutes}
          className="h-10 w-10 rounded-xl hover:bg-primary/10"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-3xl font-bold text-primary">
            {minutes.toString().padStart(2, "0")}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={decrementMinutes}
          className="h-10 w-10 rounded-xl hover:bg-primary/10"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
        <span className="text-xs text-muted-foreground mt-1">Minutos</span>
      </div>
    </div>
  );
};

export default TimePickerCustom;
