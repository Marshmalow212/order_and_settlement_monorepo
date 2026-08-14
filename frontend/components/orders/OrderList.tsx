"use client"

import React from "react"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { OrderRecord } from "@/redux/reducers/orders"

export default function OrderList({
  orders,
  onArchive,
  onView,
  onEdit,
}: {
  orders: OrderRecord[]
  onArchive?: (ids: number[]) => void
  onView?: (order: OrderRecord) => void
  onEdit?: (order: OrderRecord) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.id}</TableCell>
              <TableCell>{o.customerName ?? o.customer}</TableCell>
              <TableCell>{o.status}</TableCell>
              <TableCell>{o.total ?? o.order_total ?? o.order_total}</TableCell>
              <TableCell>{o.dueDate ?? o.due_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onView?.(o)}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit?.(o)} disabled={o.status !== "pending"}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onArchive?.([o.id])}>
                    Archive
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
