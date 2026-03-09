import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { toast } from "sonner";
import { 
  Brain, 
  RotateCcw, 
  Trophy,
  Zap,
  Clock,
  Star,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";

interface VerseCard {
  id: number;
  verse: string;
  reference: string;
  isFlipped: boolean;
  isMatched: boolean;
  type: "verse" | "reference";
}

const versePairs = [
  { verse: "O Senhor é meu pastor, nada me faltará", reference: "Salmos 23:1" },
  { verse: "Tudo posso naquele que me fortalece", reference: "Filipenses 4:13" },
  { verse: "O amor é paciente, o amor é bondoso", reference: "1 Coríntios 13:4" },
  { verse: "Busquem primeiro o Reino de Deus", reference: "Mateus 6:33" },
  { verse: "Eu sou o caminho, a verdade e a vida", reference: "João 14:6" },
  { verse: "Confie no Senhor de todo o coração", reference: "Provérbios 3:5" },
];

export default function MemoriaBiblica() {
  const authState = useAuth();
  const { awardXp } = useXpAward();
  const [cards, setCards] = useState<VerseCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil">("facil");
  const [isLocked, setIsLocked] = useState(false);

  const pairsCount = difficulty === "facil" ? 4 : difficulty === "medio" ? 5 : 6;

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
    const selectedPairs = versePairs.slice(0, pairsCount);
    const gameCards: VerseCard[] = [];
    
    selectedPairs.forEach((pair, index) => {
      gameCards.push({
        id: index * 2,
        verse: pair.verse,
        reference: pair.reference,
        isFlipped: false,
        isMatched: false,
        type: "verse"
      });
      gameCards.push({
        id: index * 2 + 1,
        verse: pair.verse,
        reference: pair.reference,
        isFlipped: false,
        isMatched: false,
        type: "reference"
      });
    });

    // Shuffle cards
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
      const card1 = cards[first];
      const card2 = cards[second];

      if (card1.reference === card2.reference && card1.type !== card2.type) {
        // Match found!
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setMatchedPairs(m => m + 1);
          setFlippedCards([]);
          setIsLocked(false);

          if (matchedPairs + 1 === pairsCount) {
            handleGameComplete();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const handleGameComplete = async () => {
    setGameComplete(true);
    
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 }
    });

    if (authState.user) {
      const xpAmount = difficulty === "facil" ? 20 : difficulty === "medio" ? 35 : 50;
      await awardXp("quiz", `memoria-${Date.now()}`, `Memória Bíblica - ${difficulty}`);
      
      toast.success("🎉 Jogo concluído!", {
        description: `+${xpAmount} XP ganhos!`
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStars = () => {
    const perfectMoves = pairsCount;
    if (moves <= perfectMoves * 1.5) return 3;
    if (moves <= perfectMoves * 2.5) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <PageHeader title="Memória Bíblica" showBack />
      
      <ResponsiveContainer className="py-6">
        {/* Header Stats */}
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

        {/* Difficulty Selector */}
        {!startTime && (
          <div className="flex justify-center gap-2 mb-6">
            {(["facil", "medio", "dificil"] as const).map((diff) => (
              <Button
                key={diff}
                variant={difficulty === diff ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(diff)}
              >
                {diff === "facil" ? "Fácil" : diff === "medio" ? "Médio" : "Difícil"}
              </Button>
            ))}
          </div>
        )}

        {/* Game Grid */}
        <div className={`grid gap-2 ${
          pairsCount <= 4 ? "grid-cols-4" : pairsCount === 5 ? "grid-cols-5" : "grid-cols-4"
        }`}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="aspect-square"
            >
              <div
                onClick={() => handleCardClick(index)}
                className={`w-full h-full cursor-pointer perspective-1000`}
              >
                <motion.div
                  className="relative w-full h-full"
                  initial={false}
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Card Back */}
                  <div 
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center backface-hidden shadow-lg"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  
                  {/* Card Front */}
                  <div 
                    className={`absolute inset-0 rounded-xl p-2 flex items-center justify-center text-center backface-hidden shadow-lg ${
                      card.isMatched 
                        ? "bg-green-500/20 border-2 border-green-500" 
                        : "bg-card border border-border"
                    }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <p className="text-[10px] sm:text-xs font-medium leading-tight">
                      {card.type === "verse" ? card.verse : card.reference}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Game Complete Modal */}
        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-card rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 ${
                        star <= getStars() 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Parabéns! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Você completou em {moves} jogadas e {formatTime(elapsedTime)}!
                </p>
                
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={initializeGame}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Jogar Novamente
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verse Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm italic text-muted-foreground">
            "Guardo a tua palavra no meu coração"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Salmos 119:11
          </p>
        </motion.div>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
