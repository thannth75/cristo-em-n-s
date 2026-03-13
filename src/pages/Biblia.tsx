import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Search, Star, ChevronRight, Volume2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import BottomNavigation from "@/components/BottomNavigation";

// Livros da Bíblia JFA organizados
const BIBLE_BOOKS = {
  "Antigo Testamento": {
    "Pentateuco": ["Gênesis","Êxodo","Levítico","Números","Deuteronômio"],
    "Históricos": ["Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester"],
    "Poéticos": ["Jó","Salmos","Provérbios","Eclesiastes","Cânticos"],
    "Profetas Maiores": ["Isaías","Jeremias","Lamentações","Ezequiel","Daniel"],
    "Profetas Menores": ["Oséias","Joel","Amós","Obadias","Jonas","Miquéias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias"],
  },
  "Novo Testamento": {
    "Evangelhos": ["Mateus","Marcos","Lucas","João"],
    "Histórico": ["Atos"],
    "Cartas de Paulo": ["Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom"],
    "Cartas Gerais": ["Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas"],
    "Profético": ["Apocalipse"],
  },
};

const Biblia = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedTestament, setExpandedTestament] = useState<string | null>("Antigo Testamento");

  useEffect(() => {
    if (!isLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, isLoading, navigate]);

  const allBooks = useMemo(() => {
    const books: { name: string; testament: string; category: string }[] = [];
    Object.entries(BIBLE_BOOKS).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, bookList]) => {
        bookList.forEach((name) => books.push({ name, testament, category }));
      });
    });
    return books;
  }, []);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return null;
    return allBooks.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allBooks]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <BookOpen className="h-4 w-4 text-primary" />
              Bíblia Sagrada
            </h1>
            <p className="text-xs text-muted-foreground">João Ferreira de Almeida — Fiel Corrigida</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Incentivo Bíblia física */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4">
          <p className="text-sm text-foreground font-medium">📖 Lembre-se: este app é uma ferramenta de apoio.</p>
          <p className="text-xs text-muted-foreground mt-1">Separe um momento para ler sua Bíblia física. A Palavra impressa é insubstituível.</p>
        </motion.div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Resultados da busca */}
        {filteredBooks ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{filteredBooks.length} livros encontrados</p>
            {filteredBooks.map((book) => (
              <div key={book.name} className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{book.name}</p>
                  <p className="text-xs text-muted-foreground">{book.category} · {book.testament}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          /* Navegação por testamento e categoria */
          Object.entries(BIBLE_BOOKS).map(([testament, categories]) => (
            <div key={testament} className="space-y-2">
              <button
                onClick={() => setExpandedTestament(expandedTestament === testament ? null : testament)}
                className="flex w-full items-center justify-between rounded-xl bg-card border border-border/70 p-3"
              >
                <h2 className="text-sm font-bold text-foreground">{testament}</h2>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedTestament === testament ? "rotate-90" : ""}`} />
              </button>

              {expandedTestament === testament && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pl-2">
                  {Object.entries(categories).map(([category, books]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-primary mb-1.5">{category}</h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {books.map((book) => (
                          <button key={book} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
                            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{book}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          ))
        )}

        {/* Versículo do dia */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 text-center">
          <p className="text-xs text-primary font-medium mb-2">✨ Versículo do Dia</p>
          <p className="text-sm text-foreground italic">"Lâmpada para os meus pés é tua palavra e luz para o meu caminho."</p>
          <p className="text-xs text-muted-foreground mt-1">Salmos 119:105</p>
        </div>

        {/* Dicionário rápido */}
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">📚 Dicionário Cristão</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { term: "Graça", def: "Favor imerecido de Deus" },
              { term: "Fé", def: "Certeza das coisas que se esperam" },
              { term: "Salvação", def: "Livramento do pecado por Cristo" },
              { term: "Redenção", def: "Resgate pelo sangue de Jesus" },
              { term: "Santificação", def: "Processo de tornar-se santo" },
              { term: "Justificação", def: "Declaração de justo por Deus" },
            ].map((item) => (
              <div key={item.term} className="rounded-xl bg-muted/30 p-2.5">
                <p className="text-xs font-semibold text-primary">{item.term}</p>
                <p className="text-[11px] text-muted-foreground">{item.def}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Biblia;
