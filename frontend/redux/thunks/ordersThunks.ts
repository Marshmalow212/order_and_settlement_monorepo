import { api } from "@/redux/apiClient"
import { setOrders, addOrder, updateOrder, setLoading, setError } from "@/redux/reducers/orders"
import type { OrderRecord } from "@/redux/reducers/orders"
import type { AppDispatch } from "@/redux/store"
import { createAsyncThunk } from "@reduxjs/toolkit"

function mapApiOrderToLocal(api: any): OrderRecord {
  return {
    id: api.id,
    customerName: api.customerName ?? api.customer ?? "",
    customer: api.customerName ?? api.customer ?? "",
    status: api.status,
    order_total: api.total ?? api.order_total ?? 0,
    total: api.total ?? api.order_total ?? 0,
    amount_paid: api.amountPaid ?? api.amount_paid ?? 0,
    amountDue: api.amountDue ?? api.amount_due ?? 0,
    amount_due: api.amountDue ?? api.amount_due ?? 0,
    dueDate: api.dueDate ?? api.due_date,
    due_date: api.dueDate ?? api.due_date,
    createdAt: api.createdAt ?? api.created_at,
    created_at: api.createdAt ?? api.created_at,
    lineItems: api.lineItems ?? api.line_items ?? undefined,
    // snake_case alias expected by some form components; normalize items for the form
    // map API line items ({description, unitPrice, quantity}) to form shape ({product_name, quantity, unit_price})
    // @ts-ignore
    line_items:
      (api.lineItems ?? api.line_items)?.map((li: any) => ({
        product_name: li.product_name ?? li.description ?? li.name ?? "",
        quantity: li.quantity != null ? String(li.quantity) : "",
        unit_price: li.unit_price != null ? String(li.unit_price) : li.unitPrice != null ? String(li.unitPrice) : "",
      })) ?? undefined,
    totalItems: api.totalItems ?? api.total_items ?? undefined,
    userId: api.userId ?? api.user_id,
  }
}

export const createOrder = (payload: Partial<OrderRecord> & { line_items?: any[] }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const body: any = {
      customerName: payload.customer ?? payload.customerName,
      status: payload.status,
      total: payload.total ?? payload.order_total,
      dueDate: payload.dueDate ?? payload.due_date,
    }
    if (payload.line_items && payload.line_items.length) {
      body.lineItems = payload.line_items.map((li: any) => ({
        description: li.product_name ?? li.description,
        unitPrice: Number(li.unit_price ?? li.unitPrice ?? 0),
        quantity: Number(li.quantity ?? 0),
      }))
    }

    const res = await api.post(`/orders`, body)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to create order"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    const order = mapApiOrderToLocal(res.data)
    dispatch(addOrder(order))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to create order"))
    dispatch(setLoading(false))
    return null
  }
}

export const updateOrderById = (id: number, payload: Partial<OrderRecord>) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const body: any = {}
    if (payload.customer ?? payload.customerName) body.customerName = payload.customer ?? payload.customerName
    if (payload.status) body.status = payload.status
    if (payload.total ?? payload.order_total) body.total = payload.total ?? payload.order_total
    if (payload.dueDate ?? payload.due_date) body.dueDate = payload.dueDate ?? payload.due_date

    // Fetch current server-side order to determine if line item replacement is allowed.
    let serverOrder: any = null
    try {
      const current = await api.get(`/orders/${id}`)
      serverOrder = current.data
    } catch (e) {
      // if we can't fetch server order, proceed cautiously and avoid sending lineItems
      serverOrder = null
    }

    const li = (payload as any).lineItems ?? (payload as any).line_items
    const serverStatus = serverOrder ? serverOrder.status : undefined
    const payloadStatus = (payload as any).status ?? (payload as any).order_status ?? undefined
    const effectiveStatus = payloadStatus ?? serverStatus

    if (li && String(effectiveStatus) === "pending") {
      body.lineItems = li.map((item: any) => ({ description: item.product_name ?? item.description, unitPrice: Number(item.unit_price ?? item.unitPrice), quantity: Number(item.quantity) }))
    }

    const res = await api.put(`/orders/${id}`, body)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to update order"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    const order = mapApiOrderToLocal(res.data)
    dispatch(updateOrder(order))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to update order"))
    dispatch(setLoading(false))
    return null
  }
}

export const fetchOrdersForUser = (_userId?: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    // GET /orders returns orders for the acting user
    const res = await api.get(`/orders`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch orders for user"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    const data = res.data as any[]
    const orders = data.map((o) => mapApiOrderToLocal(o))
    dispatch(setOrders(orders))
    dispatch(setLoading(false))
    return orders
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch orders for user"))
    dispatch(setLoading(false))
    return null
  }
}

export const fetchOrderById = (id: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/orders/${id}`)
    // also fetch line items for the order to ensure full details for edit/view
    let items: any[] | undefined
    try {
      const itemsRes = await api.get(`/line-items/order/${id}`)
      items = itemsRes.data
    } catch (e) {
      items = undefined
    }
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch order"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }

    const payload = { ...(res.data ?? {}), ...(items ? { lineItems: items } : {}) }
    const order = mapApiOrderToLocal(payload)
    // update store with fresh order details
    dispatch(updateOrder(order))
    dispatch(setLoading(false))
    return order
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch order"))
    dispatch(setLoading(false))
    return null
  }
}

export const archiveOrdersThunk = (ids: number[]) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await api.put(`/orders/${id}`, { status: "archieve" })
          const order = mapApiOrderToLocal(res.data)
          dispatch(updateOrder(order))
        } catch (e) {
          // ignore per-order failures
        }
      })
    )
    dispatch(setLoading(false))
    return true
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to archive orders"))
    dispatch(setLoading(false))
    return null
  }
}

export const operationSummary = createAsyncThunk(
  "orders/operationSummary",
  async (_, { rejectWithValue }) => {

    try {
      const response = await api.get('/orders/operation_summary');

      if (response?.status == 200) {
        return response.data
      }

    } catch (error) {
      return rejectWithValue("Opeation summary load failed!")
    }
  }
);

export default {}
