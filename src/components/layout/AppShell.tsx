import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  pipeId,
  userName = "Gestor Comercial",
  userRole = "ADMIN",
  orgName = "Grupo Mário Neto",
}: {
  children: React.ReactNode;
  pipeId?: string;
  userName?: string;
  userRole?: string;
  orgName?: string;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar pipeId={pipeId} userName={userName} userRole={userRole} orgName={orgName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar pipeId={pipeId} userName={userName} />
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}