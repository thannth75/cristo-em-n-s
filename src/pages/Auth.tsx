import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, User, Sparkles, Phone, MapPin, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-vida-em-cristo.png";
import ParallaxBackground from "@/components/ParallaxBackground";

const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta! 🙏", description: "Que bom ter você conosco novamente." });
        navigate("/dashboard");
      } else {
        if (!fullName.trim() || !city.trim() || !state) {
          toast({ title: "Campos obrigatórios", description: "Preencha nome, cidade e estado.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone.replace(/\D/g, ""),
              birth_date: birthDate || null,
              city: city.trim(),
              state,
            },
          },
        });
        if (error) throw error;
        toast({ title: "Cadastro enviado! ✝️", description: "Aguarde a aprovação de um líder ou pastor." });
        navigate("/pending");
      }
    } catch (error: any) {
      let errorMessage = "Algo deu errado. Tente novamente.";
      if (error.message?.includes("Invalid login credentials")) errorMessage = "E-mail ou senha incorretos.";
      else if (error.message?.includes("Email not confirmed")) errorMessage = "E-mail não confirmado. Verifique sua caixa de entrada.";
      else if (error.message?.includes("User already registered")) errorMessage = "Este e-mail já está cadastrado.";
      else if (error.message?.includes("Password should be at least")) errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      else if (error.message?.includes("Unable to validate email address")) errorMessage = "E-mail inválido. Verifique o formato.";
      else if (error.message?.includes("Database error")) errorMessage = "Erro interno ao salvar cadastro. Tente novamente em alguns segundos.";
      else if (error.message?.includes("Network")) errorMessage = "Erro de conexão. Verifique sua internet.";
      else if (error.message) errorMessage = error.message;
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-background overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <ParallaxBackground />
      
      {/* Hero com Logo */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_70%)]" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center justify-center px-4 pb-4 pt-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative mb-2"
          >
            <div className="absolute inset-0 blur-3xl bg-primary/10 rounded-full scale-125" />
            <motion.img
              src={logo}
              alt="Vida em Cristo"
              className="relative h-[200px] sm:h-[300px] w-auto drop-shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 text-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Ministério Ebenézer</span>
            <Sparkles className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* Card de Login/Cadastro */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 mx-4 -mt-2 rounded-3xl bg-card/95 backdrop-blur-xl p-4 sm:p-6 shadow-2xl border border-border/50 max-w-md sm:mx-auto"
      >
        {/* Tabs */}
        <div className="mb-4 flex rounded-2xl bg-muted/50 p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              isLogin ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              !isLogin ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {!isLogin && (
              <>
                {/* Nome */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo" required autoComplete="name" className="h-11 rounded-xl pl-10 bg-background/50" />
                  </div>
                </div>

                {/* Telefone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999" autoComplete="tel" className="h-11 rounded-xl pl-10 bg-background/50" />
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-sm font-medium">Data de Nascimento</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                      className="h-11 rounded-xl pl-10 bg-background/50" />
                  </div>
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="city" className="text-sm font-medium">Cidade *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)}
                        placeholder="Sua cidade" required className="h-11 rounded-xl pl-10 bg-background/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">UF *</Label>
                    <Select value={state} onValueChange={setState} required>
                      <SelectTrigger className="h-11 rounded-xl bg-background/50">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" required autoComplete="email" className="h-11 rounded-xl pl-10 bg-background/50" />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"} className="h-11 rounded-xl pl-10 pr-10 bg-background/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                Esqueceu a senha?
              </button>
            )}

            <Button type="submit" disabled={isLoading}
              className="mt-4 h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar" : "Solicitar Cadastro"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.form>
        </AnimatePresence>
      </motion.div>

      {/* Versículo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-6 px-6 pb-8 text-center"
      >
        <p className="font-serif italic text-muted-foreground">"Eu sou o caminho, a verdade e a vida."</p>
        <p className="mt-1 text-sm font-medium text-primary">— João 14:6</p>
      </motion.div>
    </div>
  );
};

export default Auth;
