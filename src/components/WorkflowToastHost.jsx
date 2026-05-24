import { useEffect, useState } from "react";

const TONES = {
  success: { border: "#A7F3D0", background: "#ECFDF5", color: "#065F46" },
  error: { border: "#FECACA", background: "#FEF2F2", color: "#991B1B" },
  info: { border: "#BFDBFE", background: "#EFF6FF", color: "#1E3A8A" },
};

export default function WorkflowToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (event) => {
      const toast = {
        id: `${Date.now()}-${Math.random()}`,
        type: event.detail?.type || "info",
        message: event.detail?.message || "",
      };
      setToasts((prev) => [...prev.slice(-2), toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, event.detail?.duration || 5000);
    };

    window.addEventListener("workflow:toast", listener);
    return () => window.removeEventListener("workflow:toast", listener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 3000, display: "grid", gap: 10, width: "min(420px, calc(100vw - 36px))" }}>
      {toasts.map((toast) => {
        const tone = TONES[toast.type] || TONES.info;
        return (
          <div key={toast.id} role="status" style={{ background: tone.background, color: tone.color, border: `1px solid ${tone.border}`, borderRadius: 10, padding: "12px 14px", boxShadow: "0 18px 40px rgba(15,37,87,.12)", fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
