"use client"

import React, { useEffect, useState } from "react"
import AuditLogList from "./AuditLogList"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchAuditLogsForUser, fetchAuditLogsForOrder, fetchAllAuditLogs } from "@/redux/thunks/auditThunks"
import { Button } from "@/components/ui/button"

export default function AuditLogListContainer({ userId = 1 }: { userId?: number }) {
  const dispatch = useAppDispatch()
  const logs = useAppSelector((s) => s.auditLogs.items)
  const [orderFilter, setOrderFilter] = useState<number | undefined>(undefined)

  const applyFilter = async () => {
    if (orderFilter && Number.isFinite(orderFilter)) {
      await dispatch(fetchAuditLogsForOrder(Number(orderFilter)) as any)
    } else {
      await dispatch(fetchAllAuditLogs() as any)
    }
  }

  const resetFilter = () => {
    setOrderFilter(undefined)
    dispatch(fetchAllAuditLogs() as any)
  }

  useEffect(() => {
    dispatch(fetchAllAuditLogs() as any)

  }, [dispatch])

  return (
    <div>
      <div className="flex gap-2 items-center mb-4">
        <input
          value={orderFilter ?? ""}
          onChange={(e) => setOrderFilter(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder="order id"
          className="rounded-md border px-2 py-1"
          type="number"
        />
        <Button variant="outline" onClick={applyFilter}>Filter</Button>
        <Button variant="ghost" onClick={resetFilter}>Reset</Button>
      </div>
      <AuditLogList logs={logs} />
    </div>
  )
}
