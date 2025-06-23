export function DataField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  )
}
