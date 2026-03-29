export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    login_required: "bg-amber-100 text-amber-800",
    coupon_field_missing: "bg-slate-100 text-slate-700",
    cart_failed: "bg-rose-100 text-rose-700",
    unknown: "bg-slate-100 text-slate-700"
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${map[status] ?? map.unknown}`}>{status}</span>;
}
