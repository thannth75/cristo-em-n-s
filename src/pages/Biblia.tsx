import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  BookMarked,
  AlertCircle,
  Languages,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import {
  BIBLE_BOOKS,
  AT_CATEGORIES,
  NT_CATEGORIES,
  type BibleBook,
} from "@/data/bibleBooks";

// ─── Tipos ───
interface BibleVerse {
  number: number;
  text: string;
}

interface StrongResult {
  id: string;
  original: string;
  transliteration: string;
  meaning: string;
  lang: string;
}

type ViewMode = "books" | "chapters" | "reading";

// ─── Componente principal ───
const Biblia = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading } = useAuth();

  // Navegação
  const [view, setView] = useState<ViewMode>("books");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // UI
  const [search, setSearch] = useState("");
  const [expandedTestament, setExpandedTestament] = useState<"AT" | "NT" | null>("AT");
  const [fontSize, setFontSize] = useState(16);

  // Dados
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  // ─── Busca de livros ───
  const filteredBooks = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return BIBLE_BOOKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.abbrev.toLowerCase().includes(q)
    );
  }, [search]);

  // ─── Agrupar livros por categoria ───
  const booksByCategory = useMemo(() => {
    const categories = expandedTestament === "NT" ? NT_CATEGORIES : AT_CATEGORIES;
    const testament = expandedTestament || "AT";
    return categories.map((cat) => ({
      category: cat,
      books: BIBLE_BOOKS.filter((b) => b.testament === testament && b.category === cat),
    }));
  }, [expandedTestament]);

  // ─── Carregar versículos ───
  const loadChapter = useCallback(
    async (book: BibleBook, chapter: number) => {
      setLoadingVerses(true);
      setVerseError(null);
      setVerses([]);

      try {
        const { data, error } = await supabase.functions.invoke("bible-reader", {
          body: { abbrev: book.abbrev, chapter },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Erro ao carregar");

        const versesData = data.data?.verses || [];
        if (versesData.length === 0) {
          throw new Error("Nenhum versículo encontrado");
        }

        setVerses(versesData);
      } catch (err: any) {
        console.error("Erro ao carregar capítulo:", err);
        setVerseError(err.message || "Erro desconhecido");
      } finally {
        setLoadingVerses(false);
      }
    },
    []
  );

  // ─── Handlers de navegação ───
  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setView("chapters");
    setSearch("");
  };

  const handleSelectChapter = (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    setView("reading");
    loadChapter(selectedBook, chapter);
  };

  const handlePrevChapter = () => {
    if (!selectedBook || selectedChapter <= 1) return;
    const prev = selectedChapter - 1;
    setSelectedChapter(prev);
    loadChapter(selectedBook, prev);
  };

  const handleNextChapter = () => {
    if (!selectedBook || selectedChapter >= selectedBook.chapters) return;
    const next = selectedChapter + 1;
    setSelectedChapter(next);
    loadChapter(selectedBook, next);
  };

  const handleBack = () => {
    if (view === "reading") {
      setView("chapters");
      setVerses([]);
      setVerseError(null);
    } else if (view === "chapters") {
      setView("books");
      setSelectedBook(null);
    } else {
      navigate("/dashboard");
    }
  };

  // ─── Loading ───
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Header title ───
  const headerTitle =
    view === "reading" && selectedBook
      ? `${selectedBook.name} ${selectedChapter}`
      : view === "chapters" && selectedBook
        ? selectedBook.name
        : "Bíblia Sagrada";

  const headerSubtitle =
    view === "reading" && selectedBook
      ? `${selectedBook.category} · ACF`
      : view === "chapters" && selectedBook
        ? `${selectedBook.chapters} capítulos · ${selectedBook.category}`
        : "Almeida Corrigida Fiel";

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg truncate">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              {headerTitle}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{headerSubtitle}</p>
          </div>

          {/* Font size controls (only in reading mode) */}
          {view === "reading" && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-xs font-bold"
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              >
                A-
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-sm font-bold"
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              >
                A+
              </Button>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* ═══════ BOOKS VIEW ═══════ */}
          {view === "books" && (
            <motion.div
              key="books"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
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
                  <p className="text-xs text-muted-foreground">
                    {filteredBooks.length} livro{filteredBooks.length !== 1 ? "s" : ""} encontrado{filteredBooks.length !== 1 ? "s" : ""}
                  </p>
                  {filteredBooks.map((book) => (
                    <button
                      key={book.abbrev}
                      onClick={() => handleSelectBook(book)}
                      className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm">{book.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {book.category} · {book.chapters} cap.
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {/* Toggle AT/NT */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedTestament("AT")}
                      className={`flex-1 rounded-xl p-3 text-sm font-semibold transition-colors border ${
                        expandedTestament === "AT"
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-card border-border/70 text-foreground hover:border-primary/20"
                      }`}
                    >
                      Antigo Testamento
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">39 livros</span>
                    </button>
                    <button
                      onClick={() => setExpandedTestament("NT")}
                      className={`flex-1 rounded-xl p-3 text-sm font-semibold transition-colors border ${
                        expandedTestament === "NT"
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-card border-border/70 text-foreground hover:border-primary/20"
                      }`}
                    >
                      Novo Testamento
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">27 livros</span>
                    </button>
                  </div>

                  {/* Livros por categoria */}
                  {booksByCategory.map(({ category, books }) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {books.map((book) => (
                          <button
                            key={book.abbrev}
                            onClick={() => handleSelectBook(book)}
                            className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                          >
                            <BookMarked className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <span className="truncate block">{book.name}</span>
                              <span className="text-[10px] text-muted-foreground">{book.chapters} cap.</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Banner incentivo */}
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4">
                <p className="text-sm text-foreground font-medium">📖 Lembre-se: este app é uma ferramenta de apoio.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Separe um momento para ler sua Bíblia física. A Palavra impressa é insubstituível.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════ CHAPTERS VIEW ═══════ */}
          {view === "chapters" && selectedBook && (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Info do livro */}
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedBook.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedBook.category} · {selectedBook.testament === "AT" ? "Antigo" : "Novo"} Testamento
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedBook.chapters} capítulo{selectedBook.chapters > 1 ? "s" : ""} · Toque para ler
                </p>
              </div>

              {/* Grade de capítulos */}
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(
                  (ch) => (
                    <button
                      key={ch}
                      onClick={() => handleSelectChapter(ch)}
                      className="aspect-square rounded-xl border border-border/60 bg-card flex items-center justify-center text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      {ch}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ READING VIEW ═══════ */}
          {view === "reading" && selectedBook && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Loading */}
              {loadingVerses && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando {selectedBook.name} {selectedChapter}...</p>
                </div>
              )}

              {/* Error */}
              {verseError && !loadingVerses && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-destructive font-medium">Erro ao carregar</p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">{verseError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadChapter(selectedBook, selectedChapter)}
                    className="mt-2"
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}

              {/* Versículos */}
              {!loadingVerses && !verseError && verses.length > 0 && (
                <>
                  {/* Título do capítulo */}
                  <div className="text-center py-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {selectedBook.name} — Capítulo {selectedChapter}
                    </h2>
                    <p className="text-xs text-muted-foreground">Almeida Corrigida Fiel</p>
                  </div>

                  {/* Texto bíblico */}
                  <div
                    className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 leading-relaxed"
                    style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                  >
                    {verses.map((v) => (
                      <span key={v.number} className="text-foreground">
                        <sup className="text-primary font-bold mr-1 text-[0.65em] select-none">
                          {v.number}
                        </sup>
                        {v.text}{" "}
                      </span>
                    ))}
                  </div>

                  {/* Navegação entre capítulos */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevChapter}
                      disabled={selectedChapter <= 1}
                      className="gap-1 rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <span className="text-xs text-muted-foreground font-medium">
                      {selectedChapter} / {selectedBook.chapters}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextChapter}
                      disabled={selectedChapter >= selectedBook.chapters}
                      className="gap-1 rounded-full"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick chapter jump */}
                  <details className="rounded-xl border border-border/50 bg-card">
                    <summary className="px-4 py-3 text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      Ir para capítulo...
                    </summary>
                    <div className="px-4 pb-4 grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                      {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(
                        (ch) => (
                          <button
                            key={ch}
                            onClick={() => handleSelectChapter(ch)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                              ch === selectedChapter
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/40 text-foreground hover:bg-primary/10"
                            }`}
                          >
                            {ch}
                          </button>
                        )
                      )}
                    </div>
                  </details>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Biblia;
