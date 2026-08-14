import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { operationSummary } from '../thunks/ordersThunks';

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue" | "archieve"

export type LineItem = {
  description: string
  unitPrice: number
  quantity: number
}

export type OrderRecord = {
  id: number
  customerName?: string
  customer?: string
  status: OrderStatus
  order_total?: number
  total?: number
  amount_paid?: number
  amount_due?: number
  amountDue?: number
  dueDate?: string
  due_date?: string
  createdAt?: string
  created_at?: string
  lineItems?: LineItem[]
  totalItems?: number
}

const initialState: {
  items: OrderRecord[]
  loading: boolean
  error: string | null,
  operationSummary: any
} = {
  items: [],
  loading: false,
  error: null,
  operationSummary: {
    isLoading: false,
    data: null
  }
}

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
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder: any) => {
    builder
    .addCase(operationSummary.pending, (state) => {
      state.operationSummary.isLoading = true
    })

    .addCase(operationSummary.fulfilled, (state, action) => {
      state.operationSummary.isLoading = false;
      state.operationSummary.data = action.payload;
    })

    .addCase(operationSummary.rejected, (state, action) => {
      state.operationSummary.isLoading = false;
      state.operationSummary.error = action.payload ?? "Something went wrong";
    });
  } ,
})

export const { setOrders, addOrder, updateOrder, archiveOrders, setLoading, setError } = ordersSlice.actions
export default ordersSlice.reducer
