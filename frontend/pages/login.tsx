import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const PASSWORD = "888";
const SESSION_KEY = "sr_auth";

export function useAuth() {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

export function requireAuth() {
  if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) !== "ok") {
    window.location.href = "/login";
  }
}

export default function Login() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "ok") {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = () => {
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "ok");
      router.replace("/");
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--canvas)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-body)",
    }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "48px 40px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "var(--shadow-lg)",
          animation: shake ? "shakeX 0.4s ease" : undefined,
          textAlign: "center",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sales Radar" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 16 }} />

        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.5px" }}>
          SALES RADAR
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 32 }}>by BAWANA</p>

        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Masukkan password"
          autoFocus
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            border: `1.5px solid ${error ? "#ef4444" : "var(--border)"}`,
            background: error ? "#fef2f2" : "var(--canvas)",
            fontSize: 16,
            color: "var(--text)",
            outline: "none",
            textAlign: "center",
            letterSpacing: 8,
            marginBottom: 12,
            transition: "border-color 0.2s",
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
            Password salah. Coba lagi.
          </p>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Masuk →
        </button>
      </div>

      <style global jsx>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
