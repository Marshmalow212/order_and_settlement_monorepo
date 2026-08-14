"use client"

import React from "react"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import type { AuditLogRecord } from "@/redux/reducers/auditLogs"
import { Badge } from "../ui/badge"

const statusMaps: Record<number, string> = {
    0: 'pending', 
    1: 'partially_paid',
    2: 'paid',
    3: 'overdue'
}

const auditStatusLabel = ( status: number ) => {
    let statusText = statusMaps[status];
    return (
        <Badge variant="default">{statusText}</Badge>
    )
}

export default function AuditLogList({ logs }: { logs: AuditLogRecord[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.id}</TableCell>
              <TableCell>{l.userId}</TableCell>
              <TableCell>{l.orderId}</TableCell>
              <TableCell>{l.amount}</TableCell>
              <TableCell>{auditStatusLabel(l.status as number)}</TableCell>
              <TableCell>{l.lastPaymentDate}</TableCell>
              <TableCell>{l.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
