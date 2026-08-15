import { Suspense } from "react"
import OrdersPage from "./OrdersPage"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersPage />
    </Suspense>
  )
}