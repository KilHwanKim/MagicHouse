type StatusChipProps = {
  enabled: boolean;
  label: string;
};

export function StatusChip({ enabled, label }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
        enabled
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-amber-300/20 bg-amber-300/10 text-amber-100"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-300" : "bg-amber-200"}`}
      />
      {label}
    </span>
  );
}
