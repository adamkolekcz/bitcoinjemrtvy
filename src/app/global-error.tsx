"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <span
            style={{
              fontSize: "6rem",
              fontWeight: 700,
              color: "#F7931A",
              lineHeight: 1,
            }}
          >
            500
          </span>

          <h2
            style={{
              marginTop: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Něco se pokazilo
          </h2>

          <p style={{ marginTop: "1rem", color: "#d4d4d4" }}>
            Bitcoin je v pořádku, ale tato stránka má problém.
          </p>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #262626",
                background: "#141414",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Zkusit znovu
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error nahrazuje root layout, next/link tu nefunguje; potřebujeme plný reload */}
            <a
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#F7931A",
                color: "#000",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              Zpět na hlavní stránku
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
