export function Emblem({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="m12 1 4 5-4 5-4-5Zm0 12 4 5-4 5-4-5ZM1 12l5-4 5 4-5 4Zm12 0 5-4 5 4-5 4Z" />
    </svg>
  );
}
