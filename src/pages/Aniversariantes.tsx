import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Cake, PartyPopper, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBirthdays, type BirthdayProfile } from "@/hooks/useBirthdays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/BottomNavigation";

const Aniversariantes = () => {
  const navigate = useNavigate();
  const { isApproved, isLoading: authLoading } = useAuth();
  const { birthdays, isLoading } = useBirthdays();
  const [search, setSearch] = useState("");

  const monthName = new Date().toLocaleString("pt-BR", { month: "long" });
  const today = new Date().getDate();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? birthdays.filter((b) => b.full_name.toLowerCase().includes(q))
      : birthdays;
  }, [birthdays, search]);

  const todays = filtered.filter((b) => b.day === today);
  const upcoming = filtered.filter((b) => b.day > today);
  const past = filtered.filter((b) => b.day < today);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isApproved) {
    navigate("/pending");
    return null;
  }

  const renderRow = (p: BirthdayProfile, highlight = false) => (
    <motion.div
      key={p.user_id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        highlight ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-muted/40"
      }`}
    >
      <Avatar className={`h-12 w-12 ${highlight ? "ring-2 ring-primary" : ""}`}>
        <AvatarImage src={p.avatar_url || ""} />
        <AvatarFallback>{p.full_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{p.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {highlight ? "🎂 Aniversário hoje!" : `Dia ${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")}`}
        </p>
      </div>
      <Button asChild size="sm" variant={highlight ? "default" : "outline"} className="rounded-xl">
        <Link to={`/perfil/${p.user_id}`}>
          <UserIcon className="h-4 w-4 mr-1" /> Perfil
        </Link>
      </Button>
    </motion.div>
  );

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}
    >
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Cake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold capitalize">Aniversariantes de {monthName}</h1>
              <p className="text-xs text-muted-foreground">{birthdays.length} no mês</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-2xl mx-auto">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card p-3 text-center border">
            <p className="text-2xl font-bold text-primary">{todays.length}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="rounded-xl bg-card p-3 text-center border">
            <p className="text-2xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">Próximos</p>
          </div>
          <div className="rounded-xl bg-card p-3 text-center border">
            <p className="text-2xl font-bold text-muted-foreground">{past.length}</p>
            <p className="text-xs text-muted-foreground">Já passou</p>
          </div>
        </div>

        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 rounded-xl"
        />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center border">
            <Cake className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground">Nenhum aniversariante este mês.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todays.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <PartyPopper className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Hoje</h2>
                  <Badge variant="secondary">{todays.length}</Badge>
                </div>
                <div className="space-y-2">{todays.map((p) => renderRow(p, true))}</div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-semibold text-sm mb-2">Próximos</h2>
                <div className="space-y-2">{upcoming.map((p) => renderRow(p))}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="font-semibold text-sm mb-2 text-muted-foreground">Já passou</h2>
                <div className="space-y-2 opacity-70">{past.map((p) => renderRow(p))}</div>
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Aniversariantes;
