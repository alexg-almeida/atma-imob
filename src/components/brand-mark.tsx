export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="16" width="6" height="13" rx="1.5" className="fill-current opacity-80" />
      <rect x="13" y="3" width="6" height="26" rx="1.5" fill="var(--color-primary)" />
      <rect x="23" y="11" width="6" height="18" rx="1.5" className="fill-current opacity-80" />
    </svg>
  );
}
