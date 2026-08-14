import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type AuditLogRecord = {
  id: number
  userId?: number
  orderId?: number
  amount?: number
  items?: number
  status?: number
  lastPaymentDate?: string | null
  createdAt?: string
}

const initialState: {
  items: AuditLogRecord[]
  loading: boolean
  error: string | null
} = {
  items: [],
  loading: false,
  error: null,
}

const auditLogsSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {
    setAuditLogs: (state, action: PayloadAction<AuditLogRecord[]>) => {
      state.items = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setAuditLogs, setLoading, setError } = auditLogsSlice.actions
export default auditLogsSlice.reducer
