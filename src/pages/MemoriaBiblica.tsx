import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { toast } from "sonner";
import { Brain, RotateCcw, Trophy, Clock, Star, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

// Ghibli art imports
import imgJesusPastor from "@/assets/memory/jesus-pastor.png";
import imgArcaNoe from "@/assets/memory/arca-noe.png";
import imgDaviGolias from "@/assets/memory/davi-golias.png";
import imgMoisesMar from "@/assets/memory/moises-mar.png";
import imgDanielLeoes from "@/assets/memory/daniel-leoes.png";
import imgPombaPaz from "@/assets/memory/pomba-paz.png";
import imgSarzaArdente from "@/assets/memory/sarza-ardente.png";
import imgNascimentoJesus from "@/assets/memory/nascimento-jesus.png";

interface MemoryCard {
  id: number;
  pairId: number;
  label: string;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardPairs = [
  { label: "Jesus, o Bom Pastor", image: imgJesusPastor },
  { label: "Arca de Noé", image: imgArcaNoe },
  { label: "Davi e Golias", image: imgDaviGolias },
  { label: "Moisés e o Mar", image: imgMoisesMar },
  { label: "Daniel e os Leões", image: imgDanielLeoes },
  { label: "Pomba da Paz", image: imgPombaPaz },
  { label: "Sarça Ardente", image: imgSarzaArdente },
  { label: "Nascimento de Jesus", image: imgNascimentoJesus },
];

export default function MemoriaBiblica() {
  const { user } = useAuth();
  const { awardXp } = useXpAward(user?.id);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil">("facil");
  const [isLocked, setIsLocked] = useState(false);

  const pairsCount = difficulty === "facil" ? 4 : difficulty === "medio" ? 6 : 8;

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !gameComplete) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, gameComplete]);

  const initializeGame = () => {
    const selected = cardPairs.slice(0, pairsCount);
    const gameCards: MemoryCard[] = [];

    selected.forEach((pair, index) => {
      gameCards.push({ id: index * 2, pairId: index, label: pair.label, image: pair.image, isFlipped: false, isMatched: false });
      gameCards.push({ id: index * 2 + 1, pairId: index, label: pair.label, image: pair.image, isFlipped: false, isMatched: false });
    });

    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    setCards(gameCards);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setGameComplete(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const handleCardClick = (cardIndex: number) => {
    if (isLocked) return;
    if (!startTime) setStartTime(Date.now());

    const card = cards[cardIndex];
    if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardIndex];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      const card1 = newCards[first];
      const card2 = newCards[second];

      if (card1.pairId === card2.pairId && first !== second) {
        setTimeout(() => {
          const matched = [...newCards];
          matched[first].isMatched = true;
          matched[second].isMatched = true;
          setCards(matched);
          setMatchedPairs(m => m + 1);
          setFlippedCards([]);
          setIsLocked(false);

          if (matchedPairs + 1 === pairsCount) {
            handleGameComplete();
          }
        }, 600);
      } else {
        setTimeout(() => {
          const reset = [...newCards];
          reset[first].isFlipped = false;
          reset[second].isFlipped = false;
          setCards(reset);
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const handleGameComplete = async () => {
    setGameComplete(true);
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });

    if (user) {
      const xpAmount = difficulty === "facil" ? 20 : difficulty === "medio" ? 35 : 50;
      await awardXp("quiz", `memoria-${Date.now()}`, `Memória Bíblica - ${difficulty}`);
      toast.success("🎉 Jogo concluído!", { description: `+${xpAmount} XP ganhos!` });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStars = () => {
    const perfect = pairsCount;
    if (moves <= perfect * 1.5) return 3;
    if (moves <= perfect * 2.5) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <PageHeader title="Memória Bíblica" showBack />

      <ResponsiveContainer className="py-6">
        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{moves} jogadas</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={initializeGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Difficulty */}
        {!startTime && (
          <div className="flex justify-center gap-2 mb-6">
            {(["facil", "medio", "dificil"] as const).map((diff) => (
              <Button key={diff} variant={difficulty === diff ? "default" : "outline"} size="sm"
                onClick={() => setDifficulty(diff)}>
                {diff === "facil" ? "Fácil (4)" : diff === "medio" ? "Médio (6)" : "Difícil (8)"}
              </Button>
            ))}
          </div>
        )}

        {/* Game Grid */}
        <div className={`grid gap-2.5 ${pairsCount <= 4 ? "grid-cols-4" : "grid-cols-4"}`}>
          {cards.map((card, index) => (
            <motion.div key={card.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: index * 0.03 }} className="aspect-square">
              <div onClick={() => handleCardClick(index)} className="w-full h-full cursor-pointer">
                <motion.div className="relative w-full h-full"
                  initial={false}
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d" }}>
                  {/* Back */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
                    style={{ backfaceVisibility: "hidden" }}>
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  {/* Front */}
                  <div className={`absolute inset-0 rounded-xl overflow-hidden flex flex-col items-center justify-center shadow-lg ${
                    card.isMatched ? "ring-2 ring-green-500 bg-green-500/10" : "bg-card border border-border"
                  }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <img src={card.image} alt={card.label}
                      className="w-full h-full object-contain p-1" loading="lazy" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Complete modal */}
        <AnimatePresence>
          {gameComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-card rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3].map((star) => (
                    <Star key={star} className={`h-8 w-8 ${star <= getStars() ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                  ))}
                </div>
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Parabéns! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Concluído em {moves} jogadas e {formatTime(elapsedTime)}!
                </p>
                <Button variant="outline" onClick={initializeGame}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Jogar Novamente
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 text-center">
          <p className="text-sm italic text-muted-foreground">"Guardo a tua palavra no meu coração"</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Salmos 119:11</p>
        </motion.div>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
