"use client";

export default function ClientDateTime({ isoString }: { isoString: string }) {
  const date = new Date(isoString.replace(' ', 'T') + (isoString.includes('Z') ? '' : 'Z'));
  const formatted = date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span>{formatted}</span>
  );
}