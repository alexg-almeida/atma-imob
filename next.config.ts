import type { NextConfig } from "next";

// Deriva host/protocolo do Storage a partir da própria URL do Supabase, para
// não fixar o domínio da instância self-hosted no código — troque só o
// NEXT_PUBLIC_SUPABASE_URL e o next.config já aponta para o Storage certo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageHost = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  // Build enxuto para produção (Docker/EasyPanel): copia só o que o
  // servidor Next precisa para rodar, sem o node_modules inteiro.
  output: "standalone",
  images: {
    remotePatterns: storageHost
      ? [
          {
            protocol: storageHost.protocol.replace(":", "") as "http" | "https",
            hostname: storageHost.hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
