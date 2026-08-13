import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue" | "archieve"

export type OrderRecord = {
  id: number
  customer: string
  status: OrderStatus
  order_total: number
  amount_paid: number
  amount_due: number
  due_date: string
  created_at?: string
  line_items?: Array<{
    product_name: string
    quantity: string
    unit_price: string
  }>
}

const initialState: {
  items: OrderRecord[]
  loading: boolean
  error: string | null
} = {
  items: [],
  loading: false,
  error: null,
}

export const fetchOrders = createAsyncThunk("orders/fetchOrders", async () => {
  return [] as OrderRecord[]
})

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderRecord[]>) => {
      state.items = action.payload
    },
    addOrder: (state, action: PayloadAction<OrderRecord>) => {
      state.items = [action.payload, ...state.items]
    },
    updateOrder: (state, action: PayloadAction<OrderRecord>) => {
      state.items = state.items.map((order) => (order.id === action.payload.id ? action.payload : order))
    },
    archiveOrders: (state, action: PayloadAction<number[]>) => {
      state.items = state.items.map((order) => (action.payload.includes(order.id) ? { ...order, status: "archieve" } : order))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? "Failed to load orders"
      })
  },
})

export const { setOrders, addOrder, updateOrder, archiveOrders } = ordersSlice.actions
export default ordersSlice.reducer
