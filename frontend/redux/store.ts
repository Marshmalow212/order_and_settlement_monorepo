import { configureStore } from "@reduxjs/toolkit"
import ordersReducer from "./features/orders/ordersSlice"

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
  },
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
