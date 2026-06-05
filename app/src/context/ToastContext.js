import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, options = {}) => {
    setToast({ message, ...options });
    const ttl = options.duration || 3000;
    if (ttl > 0) setTimeout(() => setToast(null), ttl);
  }, []);

  const hide = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ show, hide, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
