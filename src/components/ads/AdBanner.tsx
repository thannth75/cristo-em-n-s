import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

interface AdBannerProps {
  position?: "feed" | "inline" | "footer";
  className?: string;
}

// AdMob configuration
const ADMOB_APP_ID = "ca-app-pub-5086844435418084~7605117992";
const ADMOB_BANNER_ID = "ca-app-pub-5086844435418084/6826350806";

/**
 * Componente de banner de anúncios AdMob para apps nativos (Android/iOS)
 * Configurado com:
 * - App ID: ca-app-pub-5086844435418084~7605117992
 * - Banner Ad Unit ID: ca-app-pub-5086844435418084/6826350806
 * 
 * Note: AdMob only works on native apps (Android/iOS via Capacitor)
 * Web (PWA) will not show ads as AdSense was removed per user request
 */
export default function AdBanner({ position = "inline", className = "" }: AdBannerProps) {
  const [isNative, setIsNative] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    const checkPlatform = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      if (native) {
        try {
          // Dynamically import AdMob to avoid issues on web
          const { AdMob, BannerAdSize, BannerAdPosition } = await import("@capacitor-community/admob");
          
          // Initialize AdMob
          await AdMob.initialize({
            initializeForTesting: false,
          });
          
          // Show banner ad
          await AdMob.showBanner({
            adId: ADMOB_BANNER_ID,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
          });
          
          setIsAdLoaded(true);
        } catch (error) {
          console.log("AdMob not available or failed to initialize:", error);
        }
      }
    };

    checkPlatform();

    // Cleanup: hide banner when component unmounts
    return () => {
      if (isNative) {
        import("@capacitor-community/admob").then(({ AdMob }) => {
          AdMob.hideBanner().catch(() => {});
        }).catch(() => {});
      }
    };
  }, []);

  // On web platform, don't render anything (no AdSense anymore)
  if (!isNative) {
    return null;
  }

  // On native, the ad is rendered by AdMob SDK, this is just a placeholder/spacer
  const positionStyles = {
    feed: "my-4",
    inline: "my-3",
    footer: "mt-4",
  };

  // Return minimal spacer if ad is loading on native
  return (
    <div className={`${positionStyles[position]} ${className}`}>
      {isAdLoaded && (
        <div 
          className="h-[50px] bg-transparent" 
          aria-label="Espaço reservado para anúncio"
        />
      )}
    </div>
  );
}

/**
 * Anúncio integrado ao feed de posts
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
 */
export function shouldShowAdAtIndex(index: number, interval: number = 5): boolean {
  return index > 0 && (index + 1) % interval === 0;
}
