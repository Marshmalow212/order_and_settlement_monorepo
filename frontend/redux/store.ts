import { configureStore } from "@reduxjs/toolkit"
import ordersReducer from "./reducers/orders"
import paymentsReducer from "./reducers/payments"
import auditLogsReducer from "./reducers/auditLogs"

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    payments: paymentsReducer,
    auditLogs: auditLogsReducer,
  },
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
