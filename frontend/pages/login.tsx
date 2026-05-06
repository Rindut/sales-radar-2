import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const PASSWORD = "888";
const SESSION_KEY = "sr_auth";

export default function Login() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [focused, setFocused] = useState(false);

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
      background: "linear-gradient(135deg, #4a90d9 0%, #3ab5a0 50%, #2ec4a0 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", top: "-80px", left: "-80px", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-40px", right: "-60px", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", left: "10%", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-60px", width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "36px 40px 40px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: shake ? "shakeX 0.4s ease" : "fadeUp 0.4s ease both",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #4a90d9, #3ab5a0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <img src="/logo.png" alt="Sales Radar" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#0D2137", letterSpacing: "-0.3px" }}>Sales Radar</div>
            <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 1 }}>Track your pipeline, follow-up faster and close the deals with clarity.</div>
          </div>
        </div>

        {/* Password label */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: "#8a9bb0", marginBottom: 8, textTransform: "uppercase" as const }}>
          Password
        </div>

        {/* Input */}
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 10,
            background: error ? "#fef2f2" : "#f0f3f7",
            fontSize: 15,
            color: "#0D2137",
            outline: "none",
            letterSpacing: input ? 4 : 0,
            marginBottom: error ? 8 : 14,
            transition: "all 0.2s",
            boxSizing: "border-box" as const,
            boxShadow: focused ? "0 0 0 2px rgba(58,181,160,0.5)" : "none",
            border: focused ? "1.5px solid #3ab5a0" : "1.5px solid transparent",
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, fontWeight: 500 }}>
            Password salah. Coba lagi.
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: input ? "linear-gradient(135deg, #4a90d9, #3ab5a0)" : "#eef1f5",
            color: input ? "#fff" : "#a0aab5",
            fontSize: 15,
            fontWeight: 700,
            cursor: input ? "pointer" : "default",
            transition: "all 0.2s",
            letterSpacing: 0.2,
          }}
        >
          Login →
        </button>
      </div>

      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
