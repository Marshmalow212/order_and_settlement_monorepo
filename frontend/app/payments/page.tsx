"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PaymentModal from "@/components/payments/PaymentModal"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchPaymentsForOrder, fetchAllPayments } from "@/redux/thunks/paymentsThunks"
import { setPayments } from "@/redux/reducers/payments"

export default function Page() {
  const dispatch = useAppDispatch()
  const payments = useAppSelector((s) => s.payments.items)
  const [orderFilter, setOrderFilter] = useState<number | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create")
  const [activePayment, setActivePayment] = useState<any | null>(null)

  const applyFilter = async () => {
    if (orderFilter && Number.isFinite(orderFilter)) {
      await dispatch(fetchPaymentsForOrder(Number(orderFilter)) as any)
    } else {
      await dispatch(fetchAllPayments() as any)
    }
  }

  const resetFilter = () => {
    setOrderFilter(undefined)
    dispatch(fetchAllPayments() as any)
  }

  // initial load
  useEffect(() => {
    dispatch(fetchAllPayments() as any)
  }, [dispatch])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <input
                      value={orderFilter ?? ""}
                      onChange={(e) => setOrderFilter(e.target.value === "" ? undefined : Number(e.target.value))}
                      placeholder="order id"
                      className="rounded-md border px-2 py-1"
                      type="number"
                    />
                    <Button variant="outline" onClick={applyFilter}>Filter</Button>
                    <Button variant="ghost" onClick={resetFilter}>Reset</Button>
                    <div className="ms-auto">
                      <Button onClick={() => { setModalMode("create"); setActivePayment(null); setModalOpen(true) }}>New Payment</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <table className="w-full table-fixed border-collapse">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-2">ID</th>
                          <th className="pb-2">Order</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Note</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No payments. Use filter or create a new payment.</td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id} className="border-t">
                              <td className="py-2">{p.id}</td>
                              <td className="py-2">{p.orderId}</td>
                              <td className="py-2">{p.paymentAmount.toFixed(2)}</td>
                              <td className="py-2">{p.paymentDate ?? p.createdAt ?? "-"}</td>
                              <td className="py-2">{p.note ?? ""}</td>
                              <td className="py-2">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => { setActivePayment(p); setModalMode("view"); setModalOpen(true) }}>View</Button>
                                  <Button size="sm" variant="outline" onClick={() => { setActivePayment(p); setModalMode("edit"); setModalOpen(true) }}>Edit</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter />
              </Card>
              <PaymentModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modalMode}
                initial={activePayment ?? undefined}
                onSaved={async () => {
                  if (activePayment?.orderId) await dispatch(fetchPaymentsForOrder(activePayment.orderId) as any)
                  else if (orderFilter) await dispatch(fetchPaymentsForOrder(orderFilter) as any)
                }}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
