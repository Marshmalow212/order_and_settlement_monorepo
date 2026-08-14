"use client"

import React, { useEffect } from "react"
import OrderList from "./OrderList"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchOrdersForUser, } from "@/redux/thunks/ordersThunks"
import { archiveOrders } from "@/redux/reducers/orders"

export default function OrderListContainer({ userId = 1, onView, onEdit }: { userId?: number; onView?: (order: any) => void; onEdit?: (order: any) => void }) {
  const dispatch = useAppDispatch()
  const orders = useAppSelector((s) => s.orders.items)

  useEffect(() => {
    dispatch(fetchOrdersForUser(userId))
  }, [dispatch, userId])

  const handleArchive = (ids: number[]) => {
    dispatch(archiveOrders(ids))
  }

  return <OrderList orders={orders} onArchive={handleArchive} onView={onView} onEdit={onEdit} />
}
