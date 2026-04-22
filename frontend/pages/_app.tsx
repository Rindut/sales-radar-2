import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <title>Sales Radar — by Bawana</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --sidebar-bg: #1D8EDE;
          --canvas: #EBF5FD;
          --canvas-2: #D6ECFB;
          --text: #0D2137;
          --text-2: #3a6a90;
          --text-3: #7aaecb;
          --border: #BDD9F0;
          --accent: #1D8EDE;
          --accent-dim: #ddf0fc;
          --accent-text: #0a6aad;
          --amber: #F5A623;
          --amber-dim: #FFF3DC;
          --card: #ffffff;
          --shadow: 0 1px 4px rgba(29,142,222,0.07), 0 4px 16px rgba(29,142,222,0.05);
          --shadow-lg: 0 4px 24px rgba(29,142,222,0.14);
          --radius: 12px;
          --font-body: 'Plus Jakarta Sans', sans-serif;
          --font-mono: 'DM Mono', monospace;
        }
        html, body {
          background: var(--canvas);
          font-family: var(--font-body);
          color: var(--text);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        button { cursor: pointer; font-family: var(--font-body); }
        input, textarea, select { font-family: var(--font-body); }
        a { color: inherit; text-decoration: none; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.10s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.20s; }
        .fade-up-5 { animation-delay: 0.25s; }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
