import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lädt seine Standard-Fonts (.afm) zur Laufzeit aus node_modules —
  // darf deshalb nicht in den Server-Bundle gepackt werden.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      // Bewerbungs-Uploads (Ausweis, Gewerbeschein, Diplome) laufen über Server Actions.
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
