import { ImageResponse } from "next/og";

// PNG app icons rendered at build time (no binary assets in the repo).
const VARIANTS = {
  "192": { size: 192, padding: 0, radius: 42 },
  "512": { size: 512, padding: 0, radius: 112 },
  maskable: { size: 512, padding: 96, radius: 0 },
  apple: { size: 180, padding: 18, radius: 0 },
} as const;

type Variant = keyof typeof VARIANTS;

function isVariant(value: string): value is Variant {
  return value in VARIANTS;
}

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!isVariant(variant)) return new Response("Not found", { status: 404 });

  const { size, padding, radius } = VARIANTS[variant];
  const inner = size - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16a34a",
          borderRadius: radius,
        }}
      >
        <svg width={inner} height={inner} viewBox="0 0 64 64">
          <path
            d="M19 20h26L23 44h22"
            fill="none"
            stroke="#ffffff"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="46" cy="18" r="5" fill="#fb923c" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
