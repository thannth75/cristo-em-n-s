import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Trophy,
  CheckCircle,
  XCircle,
  ChevronRight,
  Award,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";
import QuizAdminToolbar from "@/components/quizzes/QuizAdminToolbar";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  book: string | null;
  difficulty: string;
  points_reward: number;
  is_active: boolean;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  points: number;
}

interface QuizAttempt {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

const Quiz = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved && user) {
      fetchData();
    }
  }, [isApproved, user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [quizzesRes, attemptsRes] = await Promise.all([
      supabase.from("bible_quizzes").select("*").eq("is_active", true),
      supabase.from("user_quiz_attempts").select("*").eq("user_id", user?.id),
    ]);

    setQuizzes(quizzesRes.data || []);
    setUserAttempts(attemptsRes.data || []);
    setIsLoading(false);
  };

  const startQuiz = async (quiz: Quiz) => {
    const { data: questionsData } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("order_position");

    if (!questionsData || questionsData.length === 0) {
      toast({ title: "Quiz vazio", description: "Este quiz não tem perguntas ainda.", variant: "destructive" });
      return;
    }

    setActiveQuiz(quiz);
    setQuestions(questionsData);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCorrectAnswers(0);
    setQuizCompleted(false);
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(score + currentQuestion.points);
      setCorrectAnswers(correctAnswers + 1);
    }
    
    setShowResult(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      
      // Calculate final values
      const finalCorrect = correctAnswers + (selectedAnswer === questions[currentQuestionIndex].correct_answer ? 1 : 0);
      const percentage = Math.round((finalCorrect / questions.length) * 100);
      
      // Save attempt
      await supabase.from("user_quiz_attempts").insert({
        user_id: user?.id,
        quiz_id: activeQuiz?.id,
        score: score,
        total_questions: questions.length,
        correct_answers: finalCorrect,
      });

      // Award XP based on performance
      if (percentage >= 80) {
        await awardXp("quiz_complete_perfect", activeQuiz?.id, `Quiz perfeito: ${activeQuiz?.title}`);
      } else {
        await awardXp("quiz_complete", activeQuiz?.id, `Quiz: ${activeQuiz?.title}`);
      }

      toast({
        title: "Quiz concluído! 🎉",
        description: `Você acertou ${finalCorrect} de ${questions.length} questões!`,
      });
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCorrectAnswers(0);
    setQuizCompleted(false);
    fetchData();
  };

  const getBestScore = (quizId: string) => {
    const attempts = userAttempts.filter(a => a.quiz_id === quizId);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map(a => a.score));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
      case "facil":
        return "bg-primary/10 text-primary";
      case "medium":
      case "medio":
        return "bg-gold/20 text-gold";
      case "hard":
      case "dificil":
        return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
      case "facil":
        return "Fácil";
      case "medium":
      case "medio":
        return "Médio";
      case "hard":
      case "dificil":
        return "Difícil";
      default: return difficulty;
    }
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Quiz in progress
  if (activeQuiz && questions.length > 0 && !quizCompleted) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader userName={userName} />
        
        <main className="px-4 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
              <span>{score} pts</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl bg-card p-6 shadow-md mb-6"
          >
            <p className="font-serif text-lg font-semibold text-foreground">
              {currentQuestion.question}
            </p>
          </motion.div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = showResult && index === currentQuestion.correct_answer;
              const isWrong = showResult && isSelected && index !== currentQuestion.correct_answer;

              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    isCorrect
                      ? "bg-primary/15 border-2 border-primary"
                      : isWrong
                      ? "bg-destructive/10 border-2 border-destructive"
                      : isSelected
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isCorrect ? "bg-primary text-primary-foreground" :
                      isWrong ? "bg-destructive text-destructive-foreground" :
                      isSelected ? "bg-primary text-primary-foreground" :
                      "bg-background text-foreground"
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-foreground">{option}</span>
                    {isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-primary" />}
                    {isWrong && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-muted p-4 mb-6"
            >
              <p className="text-sm text-muted-foreground">
                <strong>Explicação:</strong> {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          {!showResult ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              className="w-full rounded-xl"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="w-full rounded-xl">
              {currentQuestionIndex < questions.length - 1 ? "Próxima Pergunta" : "Ver Resultado"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </main>
      </div>
    );
  }

  // Quiz completed
  if (quizCompleted) {
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader userName={userName} />
        
        <main className="px-4 py-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              Quiz Concluído!
            </h2>
            <p className="text-muted-foreground mb-6">
              Você concluiu o quiz "{activeQuiz?.title}"
            </p>

            <div className="rounded-2xl bg-card p-6 shadow-md mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{score}</p>
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{correctAnswers}/{questions.length}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{percentage}%</p>
                  <p className="text-xs text-muted-foreground">Aproveitamento</p>
                </div>
              </div>
            </div>

            {percentage >= 80 && (
              <div className="mb-6 flex items-center justify-center gap-2 text-primary">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-semibold">Excelente desempenho!</span>
                <Star className="h-5 w-5 fill-current" />
              </div>
            )}

            <Button onClick={resetQuiz} className="w-full rounded-xl">
              Voltar para Quizzes
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Quiz list
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <QuizAdminToolbar
          userId={user?.id || ""}
          canManage={!!user && (isAdmin || isLeader)}
          onRefresh={fetchData}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Quizzes Bíblicos</h1>
              <p className="text-sm text-muted-foreground">Teste seu conhecimento</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Quizzes concluídos</p>
              <p className="font-serif text-2xl font-bold">
                {new Set(userAttempts.map(a => a.quiz_id)).size}
              </p>
            </div>
            <Award className="h-10 w-10 opacity-80" />
          </div>
        </motion.div>

        {/* Quiz List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-md">
            <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum quiz disponível ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, index) => {
              const bestScore = getBestScore(quiz.id);
              
              return (
                <motion.button
                  key={quiz.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => startQuiz(quiz)}
                  className="w-full rounded-2xl bg-card p-4 shadow-md text-left hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                          {getDifficultyLabel(quiz.difficulty)}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      )}
                      {quiz.book && (
                        <p className="text-xs text-primary mt-1">📖 {quiz.book}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          🏆 {quiz.points_reward} pts
                        </span>
                        {bestScore !== null && (
                          <span className="text-xs text-primary">
                            Melhor: {bestScore} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />

      {levelUpData && (
        <LevelUpCelebration
          open={showLevelUp}
          onClose={closeLevelUp}
          newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle}
          levelIcon={levelUpData.levelIcon}
          rewards={levelUpData.rewards}
        />
      )}
    </div>
  );
};

export default Quiz;
