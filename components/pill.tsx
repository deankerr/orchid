export function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border flex font-medium rounded w-fit text-xs">
      <div className="bg-secondary text-secondary-foreground py-1 px-2">{label}</div>
      <div className="py-1 px-2">{children}</div>
    </div>
  )
}
