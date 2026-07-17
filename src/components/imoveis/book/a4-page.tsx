import { A4_PX } from "@/lib/pdf/capturar-paginas";

/**
 * Página no tamanho exato de um A4 a 96dpi (794×1123px) — a mesma proporção
 * do A4 em mm, então o canvas capturado preenche o PDF sem distorcer.
 */
export function A4Page({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      data-book-page
      style={{ width: A4_PX.width, height: A4_PX.height }}
      className={`relative shrink-0 overflow-hidden bg-white font-sans text-ink ${
        padded ? "p-14" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
