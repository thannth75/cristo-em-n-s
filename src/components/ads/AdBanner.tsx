import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface AdBannerProps {
  position?: "top" | "bottom" | "inline";
  className?: string;
}

/**
 * Componente de banner de anúncios não-intrusivo
 * 
 * Para configurar o Google AdSense:
 * 1. Crie uma conta no Google AdSense (https://adsense.google.com)
 * 2. Adicione o script do AdSense no index.html:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
 * 3. Substitua o data-ad-client e data-ad-slot abaixo pelos seus IDs
 */
export default function AdBanner({ position = "inline", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    // Tentar carregar o anúncio se o script do AdSense estiver disponível
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setIsAdLoaded(true);
        setShowPlaceholder(false);
      }
    } catch (error) {
      console.log("AdSense não configurado");
    }

    // Esconder placeholder após um tempo se o anúncio não carregar
    const timer = setTimeout(() => {
      if (!isAdLoaded) {
        setShowPlaceholder(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Estilos baseados na posição
  const positionStyles = {
    top: "mb-4",
    bottom: "mt-4",
    inline: "my-4",
  };

  // Se não tem anúncio e não deve mostrar placeholder, não renderiza nada
  // Isso mantém a experiência limpa quando AdSense não está configurado
  if (!isAdLoaded && !showPlaceholder) {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={`${positionStyles[position]} ${className} overflow-hidden rounded-lg`}
    >
      {showPlaceholder && !isAdLoaded ? (
        // Placeholder sutil enquanto carrega ou quando AdSense não está configurado
        // Removido para manter a experiência limpa
        null
      ) : (
        // Container do anúncio do AdSense
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            minHeight: "50px",
            maxHeight: "100px",
          }}
          data-ad-client="ca-pub-4958300981866920"
          data-ad-slot="7093451870"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}

/**
 * Componente para anúncio entre conteúdo (mais discreto)
 */
export function AdInline({ className = "" }: { className?: string }) {
  return <AdBanner position="inline" className={`max-w-md mx-auto ${className}`} />;
}

/**
 * Componente para anúncio no rodapé de páginas
 */
export function AdFooter({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed bottom-16 left-0 right-0 z-40 px-4 ${className}`}>
      <div className="max-w-lg mx-auto">
        <Card className="p-2 bg-background/95 backdrop-blur shadow-lg border">
          <AdBanner position="bottom" />
        </Card>
      </div>
    </div>
  );
}
