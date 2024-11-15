"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import styles from "./PWAContext.module.scss";

type PWAContextType = {
  message: string;
  isPWA: boolean;
};

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string>("");
  const [isPWA, setIsPWA] = useState<boolean>(false);

  const userAgent = navigator.userAgent.toLowerCase();

  useEffect(() => {
    // Detect platform and browser
    const isMobile = /iphone|android|ipad/.test(userAgent);
    const isIOS = /iphone|ipad/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari =
      isIOS && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
    const isPWAMode = window.matchMedia("(display-mode: standalone)").matches;

    // setIsPWA(isPWAMode);

    // mozilla/5.0 (iphone; cpu iphone os 18_0_1 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.0.1 mobile/15e148 safari/604.1
    // mozilla/5.0 (iphone; cpu iphone os 18_0_1 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.0.1 mobile/15e148 safari/604.1

    if (!isMobile) {
      setMessage("Please switch to a mobile device for the best experience.");
    } else if (isIOS && isChrome) {
      setMessage(
        "For the best experience, please open this site in Safari on your iPhone."
      );
    } else if (isSafari) {
      setMessage(
        "Add this app to your home screen using the 'Share' button and 'Add to Home Screen'."
      );
    } else if (isAndroid && isChrome) {
      setMessage(
        "Add this app to your home screen using the menu (three dots) and 'Add to Home screen'."
      );
    } else if (isPWAMode) {
      setMessage("Hello, world!");
    } else {
      setMessage(
        "Your device or browser is not fully supported. Please try a different setup."
      );
    }
  }, [userAgent]);

  return (
    <PWAContext.Provider value={{ message, isPWA }}>
      {false ? (
        <div className={styles.isPWA}>
          {message}
          <br />
          {userAgent}
        </div>
      ) : (
        children
      )}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
