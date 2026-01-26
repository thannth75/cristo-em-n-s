import { useEffect, useRef, useState } from "react";

interface AdBannerProps {
  position?: "feed" | "inline" | "footer";
  className?: string;
}

/**
 * Componente de banner de anúncios não-intrusivo estilo Facebook
 * Os anúncios aparecem naturalmente integrados ao feed de conteúdo
 * 
 * Configurado com:
 * - Publisher ID: ca-pub-4958300981866920
 * - Ad Slot ID: 7093451870
 */
export default function AdBanner({ position = "inline", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Verificar se o script do AdSense está disponível
    const checkAdSense = () => {
      try {
        if (typeof window !== "undefined" && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setIsAdLoaded(true);
        }
      } catch (error) {
        // AdSense não disponível - não exibir placeholder
        setShouldRender(false);
      }
    };

    // Aguardar um pouco para o script carregar
    const timer = setTimeout(checkAdSense, 1000);

    // Se após 5 segundos o anúncio não carregar, esconder o espaço
    const hideTimer = setTimeout(() => {
      if (!isAdLoaded) {
        setShouldRender(false);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [isAdLoaded]);

  // Se não deve renderizar, retorna null (sem espaço vazio)
  if (!shouldRender) {
    return null;
  }

  // Estilos baseados na posição - integrado ao design do app
  const positionStyles = {
    feed: "my-4 rounded-2xl overflow-hidden bg-card/30",
    inline: "my-3 rounded-xl overflow-hidden",
    footer: "mt-4 rounded-xl overflow-hidden",
  };

  return (
    <div
      ref={adRef}
      className={`${positionStyles[position]} ${className}`}
    >
      {/* Container do anúncio do AdSense */}
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: isAdLoaded ? "auto" : "0px",
          maxHeight: "120px",
        }}
        data-ad-client="ca-pub-4958300981866920"
        data-ad-slot="7093451870"
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Anúncio integrado ao feed de posts (estilo Facebook)
 * Aparece entre itens de conteúdo de forma natural
 */
export function AdFeed({ className = "" }: { className?: string }) {
  return <AdBanner position="feed" className={className} />;
}

/**
 * Anúncio inline discreto para listas
 */
export function AdInline({ className = "" }: { className?: string }) {
  return <AdBanner position="inline" className={`max-w-lg mx-auto ${className}`} />;
}

/**
 * Componente para inserir anúncio após N itens em uma lista
 * Uso: renderiza junto com o conteúdo, aparece naturalmente no feed
 */
export function shouldShowAdAtIndex(index: number, interval: number = 5): boolean {
  // Mostra anúncio após cada "interval" itens (ex: após 5, 10, 15 itens)
  return index > 0 && (index + 1) % interval === 0;
}
