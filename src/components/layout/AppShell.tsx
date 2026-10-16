import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  pipeId,
  userName,
  orgName,
}: {
  children: React.ReactNode;
  pipeId?: string;
  userName?: string;
  orgName?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar userName={userName} orgName={orgName} />
      <div className="flex flex-1">
        <Sidebar pipeId={pipeId} />
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}