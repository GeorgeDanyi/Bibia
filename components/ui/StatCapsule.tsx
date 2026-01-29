export function StatCapsule({ value, caption }: { value: string; caption: string }) {
  return (
    <div data-hover className="rounded-xl bg-white/80 ring-1 ring-black/5 p-4 text-center shadow-sm">
      <div className="text-2xl font-semibold tracking-tight text-emerald-900">{value}</div>
      <div className="text-xs text-slate-500">{caption}</div>
    </div>
  )
}

export default StatCapsule






