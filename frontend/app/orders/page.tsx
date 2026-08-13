"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import InvoiceUnitEntry, { type InvoiceEntryValues } from "@/components/invoice_unit_entry"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { addOrder, archiveOrders, setOrders, updateOrder, type OrderRecord } from "@/redux/features/orders/ordersSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type OrderStatus = InvoiceEntryValues["status"]

const initialOrders: OrderRecord[] = [
  {
    id: 1,
    customer: "Northwind Traders",
    status: "pending",
    order_total: 5200,
    amount_paid: 0,
    amount_due: 5200,
    due_date: "2026-08-20",
  },
  {
    id: 2,
    customer: "Blue Peak Labs",
    status: "partially_paid",
    order_total: 3200,
    amount_paid: 1600,
    amount_due: 1600,
    due_date: "2026-08-18",
  },
  {
    id: 3,
    customer: "Cedar & Co.",
    status: "paid",
    order_total: 4100,
    amount_paid: 4100,
    amount_due: 0,
    due_date: "2026-08-10",
  },
  {
    id: 4,
    customer: "Harbor Systems",
    status: "overdue",
    order_total: 2800,
    amount_paid: 600,
    amount_due: 2200,
    due_date: "2026-07-28",
  },
  {
    id: 5,
    customer: "Aster Industries",
    status: "archieve",
    order_total: 1950,
    amount_paid: 1950,
    amount_due: 0,
    due_date: "2026-06-15",
  },
  {
    id: 6,
    customer: "Summit Retail",
    status: "pending",
    order_total: 8750,
    amount_paid: 0,
    amount_due: 8750,
    due_date: "2026-08-25",
  },
]

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

  useEffect(() => {
    dispatch(setOrders(initialOrders))
  }, [dispatch])

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

  const openModal = (mode: "create" | "edit" | "view", order?: OrderRecord) => {
    setModalMode(mode)
    setActiveOrder(order ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setActiveOrder(null)
    if (searchParams.get("modal")) {
      router.replace("/orders")
    }
  }

  const archiveSelected = () => {
    if (!selectedIds.length) {
      return
    }

    dispatch(archiveOrders(selectedIds))
    setSelectedIds([])
  }

  const saveOrder = (values: InvoiceEntryValues) => {
    if (modalMode === "edit" && activeOrder) {
      dispatch(updateOrder({ ...activeOrder, ...values, id: activeOrder.id }))
      closeModal()
      return
    }

    const nextOrder: OrderRecord = {
      id: Date.now(),
      ...values,
    }
    dispatch(addOrder(nextOrder))
    setModalOpen(false)
    setActiveOrder(null)
    router.push("/orders")
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
                            <td className="px-4 py-3">{formatCurrency(order.order_total)}</td>
                            <td className="px-4 py-3">{formatCurrency(order.amount_paid)}</td>
                            <td className="px-4 py-3">{formatCurrency(order.amount_due)}</td>
                            <td className="px-4 py-3">{formatDate(order.due_date)}</td>
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
        <DialogContent className="max-w-2xl">
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
    </SidebarProvider>
  )
}
