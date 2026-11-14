export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink">{children}</div>;
}
