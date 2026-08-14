"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import InvoiceUnitEntry, { type InvoiceEntryValues } from "@/components/invoice_unit_entry"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import type { OrderRecord } from "@/redux/reducers/orders"
import { fetchOrdersForUser, createOrder, updateOrderById, archiveOrdersThunk, fetchOrderById } from "@/redux/thunks/ordersThunks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PaymentModal from "@/components/payments/PaymentModal"

type OrderStatus = InvoiceEntryValues["status"]

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  archieve: "Archived",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const orders = useAppSelector((state) => state.orders.items)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(5)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null)

  useEffect(() => {
    // fetch orders related to userId 1 via audit logs
    dispatch(fetchOrdersForUser(1) as any)
  }, [])

  useEffect(() => {
    const modalParam = searchParams.get("modal")
    if (modalParam === "create" || modalParam === "edit" || modalParam === "view") {
      setModalMode(modalParam as "create" | "edit" | "view")
      setModalOpen(true)
      setActiveOrder(null)
    }
  }, [searchParams])

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const pagedOrders = useMemo(() => {
    const start = page * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, page, pageSize])

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const toggleSelectAll = () => {
    const currentPageIds = pagedOrders.map((order) => order.id)
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) => (allSelected ? current.filter((id) => !currentPageIds.includes(id)) : [...current, ...currentPageIds.filter((id) => !current.includes(id))]))
  }

  const openModal = async (mode: "create" | "edit" | "view", order?: OrderRecord) => {
    setModalMode(mode)
    setModalOpen(true)
    if (mode === "create") {
      setActiveOrder(null)
      return
    }

    if (order && order.id) {
      try {
        const fresh = (await dispatch(fetchOrderById(order.id) as any)) as OrderRecord
        setActiveOrder(fresh ?? order)
      } catch (e) {
        // fallback to list item if fetch fails
        setActiveOrder(order ?? null)
      }
    } else {
      setActiveOrder(order ?? null)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setActiveOrder(null)
    if (searchParams.get("modal")) {
      router.replace("/orders")
    }
  }

  const archiveSelected = async () => {
    if (!selectedIds.length) return
    try {
      await dispatch(archiveOrdersThunk(selectedIds) as any)
      setSelectedIds([])
    } catch (e) {
      // ignore for now
    }
  }

  const saveOrder = async (values: InvoiceEntryValues) => {
    try {
      if (modalMode === "edit" && activeOrder) {
        // Build a clean payload matching backend expectations
        const payload: any = {}
        if (values.customer) payload.customerName = values.customer
        if (values.status) payload.status = values.status
        if (values.order_total ?? values.order_total === 0) payload.total = values.order_total
        if (values.due_date) payload.dueDate = values.due_date

        // Include line items only when order is pending (backend requires this)
        const effectiveStatus = values.status ?? activeOrder.status
        if (values.line_items && values.line_items.length && String(effectiveStatus) === "pending") {
          payload.lineItems = values.line_items.map((li) => ({
            description: li.product_name,
            unitPrice: Number(li.unit_price),
            quantity: Number(li.quantity),
          }))
        }

        await dispatch(updateOrderById(activeOrder.id, payload) as any)
        closeModal()
        return
      }

      await dispatch(createOrder(values as any) as any)
      setModalOpen(false)
      setActiveOrder(null)
      router.push("/orders")
    } catch (e) {
      // handle errors (toast?)
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-semibold">Orders</h1>
                    <p className="text-sm text-muted-foreground">Manage customer orders, balances, and due dates.</p>
                  </div>
                  <Button onClick={() => openModal("create")}>New invoice entry</Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="overflow-hidden rounded-lg border bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select rows to archive"}
                    </div>
                    <Button variant="outline" onClick={archiveSelected} disabled={selectedIds.length === 0}>
                      Archive selected
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="w-10 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={pagedOrders.length > 0 && pagedOrders.every((order) => selectedIds.includes(order.id))}
                              onChange={toggleSelectAll}
                              className="h-4 w-4 rounded border-border"
                            />
                          </th>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Order total</th>
                          <th className="px-4 py-3 font-medium">Amount paid</th>
                          <th className="px-4 py-3 font-medium">Amount due</th>
                          <th className="px-4 py-3 font-medium">Due date</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedOrders.map((order) => (
                          <tr key={order.id} className="border-t">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(order.id)}
                                onChange={() => toggleSelect(order.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{order.customer}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                                {statusLabels[order.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">{formatCurrency(order.order_total ?? 0)}</td>
                            <td className="px-4 py-3">{formatCurrency(order.amount_paid ?? 0)}</td>
                            <td className="px-4 py-3">{formatCurrency(order.amountDue ?? 0)}</td>
                            <td className="px-4 py-3">{formatDate(order.due_date ?? "N/A")}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => openModal("view", order)}>
                                  View
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openModal("edit", order)}
                                  disabled={order.status !== "pending"}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPaymentOrderId(order.id)
                                    setPaymentModalOpen(true)
                                  }}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border px-1 text-sm text-muted-foreground">💵</span>
                                    Payment
                                  </span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <p>
                    Showing {Math.min(page * pageSize + 1, orders.length)}-{Math.min((page + 1) * pageSize, orders.length)} of {orders.length}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? undefined : closeModal())}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Create order" : modalMode === "edit" ? "Edit order" : "Order details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Review the selected order details" : "Update the customer order information below."}
            </DialogDescription>
          </DialogHeader>
          <InvoiceUnitEntry
            mode={modalMode}
            initialValues={activeOrder ?? undefined}
            onSubmit={saveOrder}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        mode="create"
        initial={paymentOrderId ? { orderId: paymentOrderId } : undefined}
        onSaved={async () => {
          // no-op: payments page handles its own refresh
        }}
      />
    </SidebarProvider>
  )
}
