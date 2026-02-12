import { ImageResponse } from "next/og";

const size = {
  width: 1200,
  height: 630,
};

export async function renderOgImage() {
  const [geistBold, geistRegular] = await Promise.all([
    fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff"
    ).then((res) => res.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        {/* Background Chart - Red declining */}
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "80%",
            opacity: 0.15,
          }}
          viewBox="0 0 1200 500"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,50 L50,60 L100,55 L150,80 L200,120 L250,100 L300,150 L350,180 L400,160 L450,200 L500,250 L550,220 L600,280 L650,300 L700,290 L750,340 L800,380 L850,360 L900,400 L950,420 L1000,440 L1050,450 L1100,470 L1150,480 L1200,500 L1200,500 L0,500 Z"
            fill="url(#redGradient)"
          />
          <path
            d="M0,50 L50,60 L100,55 L150,80 L200,120 L250,100 L300,150 L350,180 L400,160 L450,200 L500,250 L550,220 L600,280 L650,300 L700,290 L750,340 L800,380 L850,360 L900,400 L950,420 L1000,440 L1050,450 L1100,470 L1150,480 L1200,500"
            fill="none"
            stroke="#EF4444"
            strokeWidth="3"
          />
        </svg>

        {/* Bitcoin Logo - top right */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "50px",
            display: "flex",
          }}
        >
          <svg width="140" height="140" viewBox="0 0 64 65" fill="none">
            <path fill="#F7931A" d="M63.043 40.698C58.769 57.841 41.406 68.274 24.26 63.999 7.123 59.725-3.31 42.361.966 25.219 5.238 8.074 22.6-2.359 39.74 1.915c17.144 4.273 27.577 21.64 23.302 38.783Z"/>
            <path fill="#fff" fillRule="evenodd" d="M46.114 28.398c.637-4.259-2.605-6.548-7.038-8.075l1.438-5.768-3.512-.875-1.4 5.616c-.923-.23-1.87-.447-2.813-.662l1.41-5.654-3.51-.875-1.438 5.767c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.843-1.21-.934 3.751s2.605.597 2.55.634c1.422.355 1.68 1.296 1.637 2.042l-1.638 6.572c.098.025.225.06.365.117l-.102-.025-.27-.067-2.296 9.206c-.174.432-.615 1.08-1.609.834.035.052-2.552-.636-2.552-.636l-1.743 4.02 4.57 1.138c.5.126.994.255 1.484.382.342.09.681.178 1.019.264l-1.453 5.835 3.507.875 1.44-5.773c.957.26 1.887.5 2.798.726l-1.435 5.746 3.512.875 1.453-5.824c5.988 1.133 10.49.677 12.385-4.74 1.527-4.36-.076-6.875-3.226-8.515 2.294-.53 4.023-2.038 4.483-5.156Zm-8.023 11.25c-.995 4-7.257 2.347-10.123 1.59a50.264 50.264 0 0 0-.684-.178l1.928-7.73c.24.06.532.126.864.2 2.963.665 9.035 2.028 8.016 6.118Zm-7.42-9.706c2.388.638 7.599 2.029 8.506-1.607.927-3.72-4.137-4.84-6.61-5.388a30.619 30.619 0 0 1-.724-.166l-1.748 7.01c.165.042.358.094.575.151Z" clipRule="evenodd"/>
          </svg>
        </div>

        {/* Content - left aligned */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingLeft: "80px",
            paddingRight: "300px",
            flex: 1,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: "88px",
              fontWeight: "700",
              marginBottom: "24px",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            <span style={{ color: "#F7931A" }}>Bitcoin</span>
            <span style={{ color: "#ffffff", marginLeft: "24px" }}>je mrtvý</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "38px",
              color: "#a3a3a3",
              marginBottom: "48px",
              lineHeight: 1.3,
            }}
          >
            <span>Sledujeme každé prohlášení o úmrtí</span>
            <span>Bitcoinu již od roku 2010</span>
          </div>

          {/* Button */}
          <div
            style={{
              display: "flex",
              padding: "20px 50px",
              background: "#F7931A",
              borderRadius: "12px",
              fontSize: "34px",
              fontWeight: "bold",
              color: "#000000",
            }}
          >
            Je Bitcoin mrtvý?
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: geistBold, weight: 700 as const, style: "normal" as const },
        { name: "Geist", data: geistRegular, weight: 400 as const, style: "normal" as const },
      ],
    }
  );
}
