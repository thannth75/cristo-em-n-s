import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const NotificationPermissionBanner = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user already dismissed
    const wasDismissed = localStorage.getItem("notification-banner-dismissed");
    
    // Show banner only if:
    // - Notifications are supported
    // - Permission hasn't been granted or denied yet
    // - User hasn't dismissed the banner
    if (isSupported && permission === "default" && !wasDismissed) {
      // Delay showing banner
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  const handleEnable = async () => {
    await requestPermission();
    setDismissed(true);
  };

  if (!show || dismissed || permission !== "default") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 p-4"
      >
        <div className="mx-auto max-w-md rounded-2xl bg-card border border-border shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Ativar notificações?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receba alertas de eventos, conquistas e orações.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  className="rounded-xl text-xs"
                >
                  Ativar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="rounded-xl text-xs"
                >
                  Depois
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPermissionBanner;
