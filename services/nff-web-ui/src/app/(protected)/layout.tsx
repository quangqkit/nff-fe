import { AuthGuard } from "@/components/layout/AuthGuard";
import { NavigationBar } from "@/components/layout/NavigationBar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0">
          <NavigationBar />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50/80 via-blue-50/40 to-indigo-50/60 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/60">
            <div className="mx-auto px-6 pt-6 h-[calc(100vh-78px)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
