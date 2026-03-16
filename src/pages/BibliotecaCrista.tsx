import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, ExternalLink, Star, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  description: string;
  year: string;
  pages: string;
  readUrl: string;
}

const CHRISTIAN_BOOKS: Book[] = [
  { id: "1", title: "O Peregrino", author: "John Bunyan", category: "Clássico", cover: "https://m.media-amazon.com/images/I/81EbP+tMFZL._AC_UF1000,1000_QL80_.jpg", description: "A jornada alegórica de Cristão rumo à Cidade Celestial. Uma das obras mais influentes da literatura cristã.", year: "1678", pages: "272", readUrl: "https://www.gutenberg.org/ebooks/39452" },
  { id: "2", title: "Imitação de Cristo", author: "Tomás de Kempis", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71JfN+TjE8L._AC_UF1000,1000_QL80_.jpg", description: "O segundo livro mais lido do mundo depois da Bíblia. Guia prático de vida espiritual.", year: "1418", pages: "224", readUrl: "https://www.gutenberg.org/ebooks/1653" },
  { id: "3", title: "O Cristianismo Puro e Simples", author: "C.S. Lewis", category: "Apologética", cover: "https://m.media-amazon.com/images/I/71u1HcGz+IL._AC_UF1000,1000_QL80_.jpg", description: "Uma defesa racional e acessível da fé cristã pelo brilhante professor de Oxford.", year: "1952", pages: "288", readUrl: "https://archive.org/details/mere-christianity_202107" },
  { id: "4", title: "Confissões", author: "Santo Agostinho", category: "Clássico", cover: "https://m.media-amazon.com/images/I/71QyIKX6URL._AC_UF1000,1000_QL80_.jpg", description: "Autobiografia espiritual de um dos maiores pensadores cristãos, sua busca por Deus.", year: "397", pages: "352", readUrl: "https://www.gutenberg.org/ebooks/3296" },
  { id: "5", title: "A Cruz de Cristo", author: "John Stott", category: "Teologia", cover: "https://m.media-amazon.com/images/I/71QJ8E7e5bL._AC_UF1000,1000_QL80_.jpg", description: "Estudo profundo sobre o significado central da crucificação para a fé cristã.", year: "1986", pages: "400", readUrl: "#" },
  { id: "6", title: "O Caminho da Santidade", author: "J.C. Ryle", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71nIm+05IEL._AC_UF1000,1000_QL80_.jpg", description: "Um chamado sério e prático à santidade na vida cotidiana do cristão.", year: "1879", pages: "336", readUrl: "https://www.gutenberg.org/ebooks/29228" },
  { id: "7", title: "Cartas de um Diabo a Seu Aprendiz", author: "C.S. Lewis", category: "Ficção Cristã", cover: "https://m.media-amazon.com/images/I/81G7e+OIzAL._AC_UF1000,1000_QL80_.jpg", description: "Conselhos satíricos de um demônio sênior ao seu sobrinho sobre como tentar os humanos.", year: "1942", pages: "224", readUrl: "https://archive.org/details/screwt00lewi" },
  { id: "8", title: "Conhecendo Deus", author: "J.I. Packer", category: "Teologia", cover: "https://m.media-amazon.com/images/I/61qfVk7tHML._AC_UF1000,1000_QL80_.jpg", description: "Um dos livros mais vendidos sobre os atributos e o caráter de Deus.", year: "1973", pages: "286", readUrl: "#" },
  { id: "9", title: "A Prática da Presença de Deus", author: "Irmão Lawrence", category: "Devocional", cover: "https://m.media-amazon.com/images/I/61uY8O4KCHL._AC_UF1000,1000_QL80_.jpg", description: "Breves meditações sobre como viver em comunhão constante com Deus.", year: "1692", pages: "96", readUrl: "https://www.gutenberg.org/ebooks/5657" },
  { id: "10", title: "O Progresso do Peregrino para Crianças", author: "Helen Taylor", category: "Kids", cover: "https://m.media-amazon.com/images/I/81i7NjLGSNL._AC_UF1000,1000_QL80_.jpg", description: "Versão adaptada da história de Cristão para jovens leitores.", year: "1906", pages: "192", readUrl: "https://www.gutenberg.org/ebooks/58952" },
  { id: "11", title: "Os Fundamentos da Fé Cristã", author: "James M. Boice", category: "Teologia", cover: "https://m.media-amazon.com/images/I/71p3KXK+L+L._AC_UF1000,1000_QL80_.jpg", description: "Um panorama completo da doutrina cristã para iniciantes e avançados.", year: "1986", pages: "736", readUrl: "#" },
  { id: "12", title: "Oração: A Comunicação com Deus", author: "A.W. Tozer", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/51WfDN5fVfL._AC_UF1000,1000_QL80_.jpg", description: "Reflexões sobre a importância e prática da oração na vida cristã.", year: "1955", pages: "160", readUrl: "#" },
];

const categories = ["Todos", "Clássico", "Devocional", "Teologia", "Apologética", "Vida Cristã", "Ficção Cristã", "Kids"];

export default function BibliotecaCrista() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filtered = CHRISTIAN_BOOKS.filter(book => {
    const matchSearch = !search.trim() ||
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "Todos" || book.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Biblioteca Cristã" showBack />

      <ResponsiveContainer className="py-6 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-amber-600/15 via-primary/10 to-orange-600/10 border border-amber-500/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-foreground">Biblioteca Cristã</h1>
              <p className="text-xs text-muted-foreground">{CHRISTIAN_BOOKS.length} livros clássicos da fé cristã</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar livro ou autor..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-full" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((book, i) => (
            <motion.div key={book.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                <img src={book.cover} alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <Badge className="absolute top-2 left-2 text-[9px] bg-card/90 backdrop-blur text-foreground">{book.category}</Badge>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted-foreground">{book.author}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{book.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">{book.year} • {book.pages}p</span>
                  {book.readUrl !== "#" ? (
                    <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs gap-1 text-primary"
                      onClick={() => window.open(book.readUrl, "_blank")}>
                      Ler <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Em breve</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum livro encontrado</p>
          </div>
        )}
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
