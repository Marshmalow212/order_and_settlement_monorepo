import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type PaymentRecord = {
  id: number
  orderId: number
  paymentAmount: number
  paymentDate?: string
  note?: string
  createdAt?: string
}

const initialState: {
  items: PaymentRecord[]
  loading: boolean
  error: string | null
} = {
  items: [],
  loading: false,
  error: null,
}

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setPayments: (state, action: PayloadAction<PaymentRecord[]>) => {
      state.items = action.payload
    },
    addPayment: (state, action: PayloadAction<PaymentRecord>) => {
      state.items = [action.payload, ...state.items]
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setPayments, addPayment, setLoading, setError } = paymentsSlice.actions
export default paymentsSlice.reducer
