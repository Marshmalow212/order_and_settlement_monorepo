import { api } from "@/redux/apiClient"
import { setPayments, addPayment, setLoading, setError } from "@/redux/reducers/payments"
import { toast } from "sonner"
import { createOrder } from "@/redux/thunks/ordersThunks"
import type { PaymentRecord } from "@/redux/reducers/payments"
import type { AppDispatch } from "@/redux/store"

export const createPayment = (payload: Partial<PaymentRecord>) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.post(`/payments`, payload)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to create payment"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(addPayment(res.data))
    dispatch(setLoading(false))
    // show success message from API if available
    const successMsg = res?.data?.message ?? res?.data?.msg ?? "Payment created"
    toast.success(String(successMsg))
    return res.data
  } catch (err: any) {
    const apiMsg = err?.response?.data?.message ?? err?.response?.data?.msg ?? err?.message ?? "Failed to create payment"
    dispatch(setError(apiMsg))
    dispatch(setLoading(false))
    toast.error(`❗ ${String(apiMsg)}`, { action: { label: "Dismiss" } })
    return null
  }
}

export const fetchPaymentsForOrder = (orderId: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/payments/order/${orderId}`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch payments"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setPayments(res.data))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    const apiMsg = err?.response?.data?.message ?? err?.message ?? "Failed to fetch payments"
    dispatch(setError(apiMsg))
    dispatch(setLoading(false))
    toast.error(`❗ ${String(apiMsg)}`, { action: { label: "Dismiss" } })
    return null
  }
}

export const fetchAllPayments = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/payments`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch payments"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setPayments(res.data))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    const apiMsg = err?.response?.data?.message ?? err?.message ?? "Failed to fetch payments"
    dispatch(setError(apiMsg))
    dispatch(setLoading(false))
    toast.error(`❗ ${String(apiMsg)}`, { action: { label: "Dismiss" } })
    return null
  }
}
