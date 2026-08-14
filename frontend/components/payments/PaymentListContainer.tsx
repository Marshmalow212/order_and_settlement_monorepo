"use client"

import React, { useEffect } from "react"
import PaymentList from "./PaymentList"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchPaymentsForOrder } from "@/redux/thunks/paymentsThunks"

export default function PaymentListContainer({ orderId }: { orderId: number }) {
  const dispatch = useAppDispatch()
  const payments = useAppSelector((s) => s.payments.items)

  useEffect(() => {
    if (orderId) dispatch(fetchPaymentsForOrder(orderId))
  }, [dispatch, orderId])

  return <PaymentList payments={payments} />
}
