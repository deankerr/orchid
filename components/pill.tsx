export function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-fit rounded border text-xs font-medium">
      <div className="bg-secondary px-2 py-1 text-secondary-foreground">{label}</div>
      <div className="px-2 py-1">{children}</div>
    </div>
  )
}
