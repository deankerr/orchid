export function LayoutGridOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {/* Center lines */}
      <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-red-500 opacity-50"></div>
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-red-500 opacity-50"></div>

      {/* 50% lines from edges */}
      <div className="absolute left-[25%] h-full w-px bg-blue-500 opacity-25"></div>
      <div className="absolute left-[75%] h-full w-px bg-blue-500 opacity-25"></div>
      <div className="absolute top-[25%] h-px w-full bg-blue-500 opacity-25"></div>
      <div className="absolute top-[75%] h-px w-full bg-blue-500 opacity-25"></div>
    </div>
  )
}
