type StatCardProps = {
  icon: string;
  value: string | number;
  label: string;
};

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
