import { Sidebar } from "./Sidebar";
import { InactivityTimer } from "./InactivityTimer";

export function AppShell({
  children,
  pipeId,
  userName = "Gestor Comercial",
  userRole = "ADMIN",
  orgName = "Grupo Mário Neto",
  allowedMenus,
}: {
  children: React.ReactNode;
  pipeId?: string;
  userName?: string;
  userRole?: string;
  orgName?: string;
  allowedMenus?: string;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <InactivityTimer />
      <Sidebar pipeId={pipeId} userName={userName} userRole={userRole} orgName={orgName} allowedMenus={allowedMenus} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-x-hidden p-4 sm:p-5">{children}</main>
      </div>
    </div>
  );
}