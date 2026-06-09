import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Heart, ChevronLeft, ChevronRight, X, BookMarked, ExternalLink } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  chapters?: BookChapter[];
}

interface BookChapter {
  title: string;
  content: string;
}

// Sample chapters for books with in-app reading
const PILGRIM_CHAPTERS: BookChapter[] = [
  { title: "Capítulo 1 — A Fuga", content: "Quando caminhava pelo deserto deste mundo, encontrei um lugar onde havia uma caverna; ali me deitei para dormir. Enquanto dormia, tive um sonho, e eis que vi um homem vestido de trapos, parado em certo lugar, com o rosto voltado para longe de sua própria casa, um livro na mão, e um grande fardo sobre as costas.\n\nAbriu o livro e leu; e enquanto lia, chorava e tremia; e, não podendo mais conter-se, prorrompeu em prantos, exclamando: \"Que farei?\"\n\nNesse estado, voltou para casa e conteve-se o quanto pôde, para que sua esposa e filhos não percebessem sua angústia; mas não pôde ficar em silêncio por muito tempo, porque sua aflição aumentava. Finalmente abriu o coração à sua esposa e filhos, dizendo: \"Ó minha querida esposa e vós, filhos da minha afeição, eu, vosso amigo querido, estou em mim mesmo completamente desfeito por causa de um fardo que pesa terrivelmente sobre mim.\"" },
  { title: "Capítulo 2 — O Pântano do Desânimo", content: "Então vi no meu sonho que Cristão e Flexível caminhavam juntos pela planície, conversando sobre o que tinham ouvido. Chegaram a um pântano muito lodoso que estava no meio da planície, e, como não o viram, caíram ambos nele. O nome do pântano era Desânimo.\n\nAli se revolveram por algum tempo, ficando terrivelmente sujos de lama. Cristão, por causa do fardo que carregava nas costas, começou a afundar no lodaçal.\n\nEntão disse Flexível: \"Ah! Vizinho Cristão, onde estais agora?\"\n\"Na verdade\", respondeu Cristão, \"não sei.\"\n\nFlexível começou a se ofender e disse com voz de irritação: \"É esta a felicidade que me contaste todo esse tempo? Se temos tão mau começo, que podemos esperar até o fim da viagem? Se eu sair deste lugar com vida, podereis possuir sozinho aquela terra formosa.\"" },
  { title: "Capítulo 3 — O Portão Estreito", content: "Então vi no meu sonho que Cristão chegou ao portão estreito. Sobre o portão estava escrito: \"Batei, e abrir-se-vos-á.\"\n\nBateu, pois, várias vezes, dizendo:\n\"Posso agora entrar aqui?\nAbrirão ao pobre pecador que bateu,\nEmbora tenha sido um rebelde indigno?\nNão serei mandado embora?\"\n\nFinalmente veio ao portão uma pessoa grave, chamada Boa Vontade, que lhe perguntou quem estava ali, de onde vinha e o que queria.\n\n\"Aqui está um pobre e oprimido pecador\", respondeu Cristão. \"Venho do Cidade da Destruição, mas vou para o Monte Sião, para ser libertado da ira vindoura. Disseram-me que o caminho passa por este portão. Estais disposto a deixar-me entrar?\"\n\n\"Com boa vontade\", disse o homem, abrindo o portão." },
  { title: "Capítulo 4 — A Casa do Intérprete", content: "Então vi no meu sonho que o caminho que Cristão devia seguir era ladeado de ambos os lados por um muro chamado Salvação.\n\nCristão correu por esse caminho, mas não sem dificuldade, por causa do fardo que carregava nas costas. Correu até chegar a um lugar um pouco elevado, onde havia uma cruz, e um pouco abaixo, no fundo, um sepulcro.\n\nVi então, no meu sonho, que justamente quando Cristão chegava à cruz, seu fardo se desprendeu de seus ombros, rolou e caiu na abertura do sepulcro, onde não mais foi visto.\n\nEntão Cristão ficou alegre e leve, e disse com o coração transbordante: \"Ele me deu descanso com o seu sofrimento e vida com a sua morte.\"" },
];

const IMITATION_CHAPTERS: BookChapter[] = [
  { title: "Livro I, Cap. 1 — Da Imitação de Cristo", content: "\"Quem me segue não anda em trevas\", diz o Senhor (João 8:12). Estas são palavras de Cristo, pelas quais somos advertidos a imitar sua vida e seus costumes, se verdadeiramente queremos ser iluminados e livres de toda cegueira de coração.\n\nSeja, pois, nosso principal empenho meditar sobre a vida de Jesus Cristo.\n\nA doutrina de Cristo excede toda a doutrina dos Santos; e quem tivesse o espírito d'Ele acharia nela o maná escondido. Acontece, porém, que muitos, de tanto ouvir o Evangelho, pouco afeto sentem, porque não possuem o espírito de Cristo.\n\nQuem quer entender plenamente e saborear as palavras de Cristo é preciso que procure conformar toda a sua vida com a d'Ele." },
  { title: "Livro I, Cap. 2 — Da Humildade", content: "Todo homem naturalmente deseja saber; mas a ciência sem o temor de Deus, que vale ela?\n\nMelhor é, sem dúvida, o camponês humilde que serve a Deus do que o filósofo soberbo que, descuidando de si, estuda o curso dos astros.\n\nQuem bem se conhece torna-se desprezível a seus próprios olhos e não se deleita com os louvores dos homens.\n\nSe eu soubesse todas as coisas do mundo e não tivesse caridade, de que me serviria isso diante de Deus, que me há de julgar pelas obras?\n\nModera o desejo excessivo de saber, porque nele se encontra grande distração e engano." },
  { title: "Livro I, Cap. 3 — Da Verdade", content: "Feliz aquele a quem a verdade por si mesma instrui, não por figuras e vozes transitórias, mas tal como é em si.\n\nNossa opinião e nossos sentidos muitas vezes nos enganam, e muito pouco alcançam.\n\nDe que servem as grandes sutilezas sobre coisas ocultas e obscuras, por cuja ignorância não seremos condenados no dia do juízo?\n\nGrande loucura é descuidarmos das coisas úteis e necessárias para nos entregarmos curiosamente às nocivas. Temos olhos e não vemos.\n\nQuem entende a palavra eterna se liberta de muitas opiniões vãs." },
];

const CHRISTIAN_BOOKS: Book[] = [
  { id: "1", title: "O Peregrino", author: "John Bunyan", category: "Clássico", cover: "https://m.media-amazon.com/images/I/81EbP+tMFZL._AC_UF1000,1000_QL80_.jpg", description: "A jornada alegórica de Cristão rumo à Cidade Celestial.", year: "1678", pages: "272", readUrl: "https://www.gutenberg.org/ebooks/39452", chapters: PILGRIM_CHAPTERS },
  { id: "2", title: "Imitação de Cristo", author: "Tomás de Kempis", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71JfN+TjE8L._AC_UF1000,1000_QL80_.jpg", description: "O segundo livro mais lido do mundo depois da Bíblia.", year: "1418", pages: "224", readUrl: "https://www.gutenberg.org/ebooks/1653", chapters: IMITATION_CHAPTERS },
  { id: "3", title: "O Cristianismo Puro e Simples", author: "C.S. Lewis", category: "Apologética", cover: "https://m.media-amazon.com/images/I/71u1HcGz+IL._AC_UF1000,1000_QL80_.jpg", description: "Uma defesa racional e acessível da fé cristã.", year: "1952", pages: "288", readUrl: "https://archive.org/details/mere-christianity_202107" },
  { id: "4", title: "Confissões", author: "Santo Agostinho", category: "Clássico", cover: "https://m.media-amazon.com/images/I/71QyIKX6URL._AC_UF1000,1000_QL80_.jpg", description: "Autobiografia espiritual de um dos maiores pensadores cristãos.", year: "397", pages: "352", readUrl: "https://www.gutenberg.org/ebooks/3296" },
  { id: "5", title: "A Cruz de Cristo", author: "John Stott", category: "Teologia", cover: "https://m.media-amazon.com/images/I/71QJ8E7e5bL._AC_UF1000,1000_QL80_.jpg", description: "Estudo profundo sobre o significado central da crucificação.", year: "1986", pages: "400", readUrl: "#" },
  { id: "6", title: "O Caminho da Santidade", author: "J.C. Ryle", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71nIm+05IEL._AC_UF1000,1000_QL80_.jpg", description: "Um chamado sério e prático à santidade na vida cotidiana.", year: "1879", pages: "336", readUrl: "https://www.gutenberg.org/ebooks/29228" },
  { id: "7", title: "Cartas de um Diabo a Seu Aprendiz", author: "C.S. Lewis", category: "Ficção Cristã", cover: "https://m.media-amazon.com/images/I/81G7e+OIzAL._AC_UF1000,1000_QL80_.jpg", description: "Conselhos satíricos de um demônio sênior ao seu sobrinho.", year: "1942", pages: "224", readUrl: "https://archive.org/details/screwt00lewi" },
  { id: "8", title: "Conhecendo Deus", author: "J.I. Packer", category: "Teologia", cover: "https://m.media-amazon.com/images/I/61qfVk7tHML._AC_UF1000,1000_QL80_.jpg", description: "Um dos livros mais vendidos sobre os atributos de Deus.", year: "1973", pages: "286", readUrl: "#" },
  { id: "9", title: "A Prática da Presença de Deus", author: "Irmão Lawrence", category: "Devocional", cover: "https://m.media-amazon.com/images/I/61uY8O4KCHL._AC_UF1000,1000_QL80_.jpg", description: "Meditações sobre viver em comunhão constante com Deus.", year: "1692", pages: "96", readUrl: "https://www.gutenberg.org/ebooks/5657" },
  { id: "10", title: "O Progresso do Peregrino para Crianças", author: "Helen Taylor", category: "Kids", cover: "https://m.media-amazon.com/images/I/81i7NjLGSNL._AC_UF1000,1000_QL80_.jpg", description: "Versão adaptada da história de Cristão para jovens leitores.", year: "1906", pages: "192", readUrl: "https://www.gutenberg.org/ebooks/58952" },
  { id: "11", title: "Os Fundamentos da Fé Cristã", author: "James M. Boice", category: "Teologia", cover: "https://m.media-amazon.com/images/I/71p3KXK+L+L._AC_UF1000,1000_QL80_.jpg", description: "Um panorama completo da doutrina cristã.", year: "1986", pages: "736", readUrl: "#" },
  { id: "12", title: "Oração: A Comunicação com Deus", author: "A.W. Tozer", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/51WfDN5fVfL._AC_UF1000,1000_QL80_.jpg", description: "Reflexões sobre a importância e prática da oração.", year: "1955", pages: "160", readUrl: "#" },
  // Novos livros
  { id: "13", title: "O Combate Espiritual", author: "Lourenço Scupoli", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71dGKRhee5L._AC_UF1000,1000_QL80_.jpg", description: "Manual clássico sobre a luta interior contra as tentações e vícios.", year: "1589", pages: "240", readUrl: "#" },
  { id: "14", title: "A Cidade de Deus", author: "Santo Agostinho", category: "Clássico", cover: "https://m.media-amazon.com/images/I/81hj7SWVFNL._AC_UF1000,1000_QL80_.jpg", description: "A grande obra-prima de Agostinho sobre a história da humanidade à luz de Deus.", year: "426", pages: "1100", readUrl: "https://www.gutenberg.org/ebooks/45304" },
  { id: "15", title: "Ortodoxia", author: "G.K. Chesterton", category: "Apologética", cover: "https://m.media-amazon.com/images/I/71-U1+g7KkL._AC_UF1000,1000_QL80_.jpg", description: "Uma jornada intelectual e espiritual rumo à fé cristã.", year: "1908", pages: "192", readUrl: "https://www.gutenberg.org/ebooks/130" },
  { id: "16", title: "O Poder da Oração", author: "E.M. Bounds", category: "Devocional", cover: "https://m.media-amazon.com/images/I/61rCAIbj8RL._AC_UF1000,1000_QL80_.jpg", description: "Ensinamentos profundos sobre o poder transformador da oração.", year: "1912", pages: "176", readUrl: "https://www.gutenberg.org/ebooks/66688" },
  { id: "17", title: "A Porta Estreita", author: "André Gide", category: "Ficção Cristã", cover: "https://m.media-amazon.com/images/I/71p3K3QVZRL._AC_UF1000,1000_QL80_.jpg", description: "Romance sobre a busca apaixonada pela perfeição espiritual.", year: "1909", pages: "160", readUrl: "#" },
  { id: "18", title: "Pensamentos", author: "Blaise Pascal", category: "Apologética", cover: "https://m.media-amazon.com/images/I/81rD9rQRIAL._AC_UF1000,1000_QL80_.jpg", description: "Fragmentos brilhantes sobre fé, razão e a condição humana.", year: "1670", pages: "320", readUrl: "https://www.gutenberg.org/ebooks/18269" },
  // Expansão da biblioteca — clássicos cristãos em domínio público
  { id: "19", title: "Sermões de John Wesley", author: "John Wesley", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71YbF5cQa3L._AC_UF1000,1000_QL80_.jpg", description: "Coletânea de sermões fundamentais do fundador do metodismo.", year: "1771", pages: "560", readUrl: "https://www.ccel.org/ccel/wesley/sermons.html" },
  { id: "20", title: "Instituição da Religião Cristã", author: "João Calvino", category: "Teologia", cover: "https://m.media-amazon.com/images/I/71r7K0+M4VL._AC_UF1000,1000_QL80_.jpg", description: "Obra-prima da Reforma sobre a doutrina cristã.", year: "1559", pages: "1500", readUrl: "https://www.ccel.org/ccel/calvin/institutes.html" },
  { id: "21", title: "Confissão de Fé de Westminster", author: "Assembleia de Westminster", category: "Teologia", cover: "https://m.media-amazon.com/images/I/61yI3p+xJYL._AC_UF1000,1000_QL80_.jpg", description: "Padrão doutrinário reformado clássico.", year: "1647", pages: "120", readUrl: "https://www.ccel.org/creeds/westminster-conf/" },
  { id: "22", title: "Tratado do Amor de Deus", author: "São Francisco de Sales", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71yp5T8e1aL._AC_UF1000,1000_QL80_.jpg", description: "Obra clássica sobre o amor divino e a vida espiritual.", year: "1616", pages: "560", readUrl: "https://www.ccel.org/ccel/desales/love.html" },
  { id: "23", title: "Filocalia da Oração de Jesus", author: "Padres do Deserto", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71V0v6FaPGL._AC_UF1000,1000_QL80_.jpg", description: "Textos espirituais sobre a oração contínua do coração.", year: "1782", pages: "480", readUrl: "https://archive.org/details/philokalia-of-the-jesus-prayer" },
  { id: "24", title: "Diário de George Müller", author: "George Müller", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71v8aZJzM3L._AC_UF1000,1000_QL80_.jpg", description: "Relato vivo do poder da oração e da fé prática.", year: "1860", pages: "400", readUrl: "https://www.gutenberg.org/ebooks/41349" },
  { id: "25", title: "O Cristão Completo", author: "William Gurnall", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/81lFp7BvJ8L._AC_UF1000,1000_QL80_.jpg", description: "Tratado puritano sobre a armadura espiritual.", year: "1655", pages: "1200", readUrl: "https://www.ccel.org/ccel/gurnall/armour.html" },
  { id: "26", title: "Crendo em Deus", author: "F.B. Meyer", category: "Devocional", cover: "https://m.media-amazon.com/images/I/61f8FtPp+VL._AC_UF1000,1000_QL80_.jpg", description: "Meditações práticas sobre a fé cotidiana.", year: "1903", pages: "180", readUrl: "https://www.ccel.org/ccel/meyer" },
  { id: "27", title: "Sermões a Crianças", author: "Charles Spurgeon", category: "Kids", cover: "https://m.media-amazon.com/images/I/71O3aQrW2sL._AC_UF1000,1000_QL80_.jpg", description: "Pregações simples e profundas para os pequenos.", year: "1880", pages: "160", readUrl: "https://www.gutenberg.org/ebooks/29521" },
  { id: "28", title: "Discursos sobre a Religião", author: "Friedrich Schleiermacher", category: "Apologética", cover: "https://m.media-amazon.com/images/I/71vJ7+J7e3L._AC_UF1000,1000_QL80_.jpg", description: "Defesa do sentimento religioso aos seus desprezadores cultos.", year: "1799", pages: "240", readUrl: "https://www.ccel.org/ccel/schleiermacher" },
  { id: "29", title: "Bem-aventurados os Pobres de Espírito", author: "Mestre Eckhart", category: "Devocional", cover: "https://m.media-amazon.com/images/I/61W5w8gNvHL._AC_UF1000,1000_QL80_.jpg", description: "Sermões místicos do mestre dominicano.", year: "1320", pages: "200", readUrl: "https://www.ccel.org/ccel/eckhart" },
  { id: "30", title: "Pequena História da Igreja", author: "Eusébio de Cesareia", category: "Clássico", cover: "https://m.media-amazon.com/images/I/81lQfTKkLEL._AC_UF1000,1000_QL80_.jpg", description: "Primeira grande história do cristianismo primitivo.", year: "325", pages: "560", readUrl: "https://www.ccel.org/ccel/schaff/npnf201" },
  { id: "31", title: "Suma Teológica (Seleção)", author: "Santo Tomás de Aquino", category: "Teologia", cover: "https://m.media-amazon.com/images/I/81X3+lE+P4L._AC_UF1000,1000_QL80_.jpg", description: "Síntese clássica da teologia escolástica.", year: "1274", pages: "800", readUrl: "https://www.ccel.org/ccel/aquinas/summa.html" },
  { id: "32", title: "Subida do Monte Carmelo", author: "São João da Cruz", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71r4UgKzL3L._AC_UF1000,1000_QL80_.jpg", description: "Tratado clássico sobre a noite escura da alma.", year: "1585", pages: "320", readUrl: "https://www.ccel.org/ccel/john_cross/ascent.html" },
  { id: "33", title: "Castelo Interior", author: "Santa Teresa de Ávila", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71hO1nx8wxL._AC_UF1000,1000_QL80_.jpg", description: "As sete moradas da alma no caminho com Deus.", year: "1577", pages: "240", readUrl: "https://www.ccel.org/ccel/teresa/castle.html" },
  { id: "34", title: "Por que Sou Cristão", author: "F.W. Boreham", category: "Apologética", cover: "https://m.media-amazon.com/images/I/61y0V5y3aXL._AC_UF1000,1000_QL80_.jpg", description: "Ensaios sobre a beleza e a razão da fé.", year: "1928", pages: "192", readUrl: "https://archive.org/details/whyiamachristian" },
  { id: "35", title: "Salmos para Cada Dia", author: "Charles Spurgeon", category: "Devocional", cover: "https://m.media-amazon.com/images/I/91hCgB4FvJL._AC_UF1000,1000_QL80_.jpg", description: "Comentário devocional sobre os 150 Salmos (Treasury of David).", year: "1885", pages: "1200", readUrl: "https://www.ccel.org/ccel/spurgeon/treasury" },
  { id: "36", title: "O Estudo da Bíblia", author: "R.A. Torrey", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71dW3J3X3CL._AC_UF1000,1000_QL80_.jpg", description: "Método prático para estudar e meditar nas Escrituras.", year: "1921", pages: "160", readUrl: "https://www.gutenberg.org/ebooks/16018" },
  { id: "37", title: "Vida de Jesus", author: "Frederic W. Farrar", category: "Clássico", cover: "https://m.media-amazon.com/images/I/81qaqfWlGTL._AC_UF1000,1000_QL80_.jpg", description: "Biografia clássica e devocional do Senhor Jesus.", year: "1874", pages: "720", readUrl: "https://www.gutenberg.org/ebooks/35385" },
  { id: "38", title: "Aurora — Devocionário Diário", author: "Charles Spurgeon", category: "Devocional", cover: "https://m.media-amazon.com/images/I/71xCsTcCJlL._AC_UF1000,1000_QL80_.jpg", description: "Manhã por manhã: meditações diárias do Príncipe dos Pregadores.", year: "1865", pages: "400", readUrl: "https://www.gutenberg.org/ebooks/14914" },
  { id: "39", title: "Heróis e Heroínas da Fé", author: "J.G. Lawson", category: "Vida Cristã", cover: "https://m.media-amazon.com/images/I/71YkN5N+TKL._AC_UF1000,1000_QL80_.jpg", description: "Biografias inspiradoras de homens e mulheres usados por Deus.", year: "1911", pages: "320", readUrl: "https://www.ccel.org/ccel/lawson/heroes.html" },
  { id: "40", title: "O Reino de Deus em Vós", author: "Liev Tolstói", category: "Ficção Cristã", cover: "https://m.media-amazon.com/images/I/81fJgKnaUEL._AC_UF1000,1000_QL80_.jpg", description: "Reflexões radicais sobre o evangelho e a não-violência.", year: "1894", pages: "400", readUrl: "https://www.gutenberg.org/ebooks/43372" },
];


const categories = ["Todos", "Favoritos", "Clássico", "Devocional", "Teologia", "Apologética", "Vida Cristã", "Ficção Cristã", "Kids"];

export default function BibliotecaCrista() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("library-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Removido dos favoritos" });
      } else {
        next.add(id);
        toast({ title: "Adicionado aos favoritos! ❤️" });
      }
      localStorage.setItem("library-favorites", JSON.stringify([...next]));
      return next;
    });
  }, [toast]);

  const filtered = CHRISTIAN_BOOKS.filter(book => {
    const matchSearch = !search.trim() ||
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    if (selectedCategory === "Favoritos") return matchSearch && favorites.has(book.id);
    const matchCategory = selectedCategory === "Todos" || book.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const openBook = (book: Book) => {
    if (book.chapters && book.chapters.length > 0) {
      setReadingBook(book);
      setCurrentChapter(0);
    } else if (book.readUrl !== "#") {
      window.open(book.readUrl, "_blank");
    } else {
      toast({ title: "Em breve", description: "Este livro estará disponível para leitura em breve." });
    }
  };

  // In-app reader
  if (readingBook && readingBook.chapters) {
    const chapter = readingBook.chapters[currentChapter];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Reader header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setReadingBook(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="text-sm font-semibold text-foreground truncate flex-1 text-center">{readingBook.title}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="text-xs px-2 py-1 rounded bg-muted">A-</button>
              <button onClick={() => setFontSize(f => Math.min(24, f + 2))} className="text-sm px-2 py-1 rounded bg-muted font-bold">A+</button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {chapter.title} · {currentChapter + 1}/{readingBook.chapters.length}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto px-5 py-6">
            <h3 className="font-serif text-lg font-bold text-foreground mb-4">{chapter.title}</h3>
            <div
              className="text-foreground leading-relaxed whitespace-pre-wrap font-serif"
              style={{ fontSize }}
            >
              {chapter.content}
            </div>
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-lg border-t border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={currentChapter === 0}
            onClick={() => setCurrentChapter(c => c - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">{currentChapter + 1} de {readingBook.chapters.length}</span>
          <Button variant="ghost" size="sm" disabled={currentChapter >= readingBook.chapters.length - 1}
            onClick={() => setCurrentChapter(c => c + 1)}>
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Biblioteca Cristã" showBack />

      <ResponsiveContainer className="py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-600/15 via-primary/10 to-orange-600/10 border border-amber-500/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-foreground">Biblioteca Cristã</h1>
              <p className="text-xs text-muted-foreground">
                {CHRISTIAN_BOOKS.length} livros · {favorites.size} favorito{favorites.size !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

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
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1",
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {cat === "Favoritos" && <Heart className="h-3 w-3" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((book) => (
            <div key={book.id}
              className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
              <button onClick={() => toggleFavorite(book.id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-card/80 backdrop-blur-sm shadow-sm hover:bg-card transition-colors">
                <Heart className={cn("h-3.5 w-3.5 transition-colors", favorites.has(book.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
              </button>
              <div className="aspect-[3/4] overflow-hidden bg-muted relative cursor-pointer" onClick={() => openBook(book)}>
                <img src={book.cover} alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <Badge className="absolute top-2 left-2 text-[9px] bg-card/90 backdrop-blur text-foreground">{book.category}</Badge>
                {book.chapters && (
                  <Badge className="absolute bottom-2 left-2 text-[9px] bg-primary text-primary-foreground">
                    <BookMarked className="h-2.5 w-2.5 mr-0.5" /> Ler no app
                  </Badge>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted-foreground">{book.author}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{book.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">{book.year} • {book.pages}p</span>
                  <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs gap-1 text-primary"
                    onClick={() => openBook(book)}>
                    {book.chapters ? "Ler" : book.readUrl !== "#" ? (<>Abrir <ExternalLink className="h-3 w-3" /></>) : "Em breve"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            {selectedCategory === "Favoritos" ? (
              <>
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum favorito ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Toque no ❤️ para salvar livros</p>
              </>
            ) : (
              <>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum livro encontrado</p>
              </>
            )}
          </div>
        )}
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
