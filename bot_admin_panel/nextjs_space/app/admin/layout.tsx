import { AppShell } from '@/components/layouts/app-shell'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader />}
    >
      {children}
    </AppShell>
  )
}
