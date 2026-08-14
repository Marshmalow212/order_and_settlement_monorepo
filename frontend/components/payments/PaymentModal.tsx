"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/redux/apiClient"
import { useAppDispatch } from "@/redux/hooks"
import { createPayment, fetchPaymentsForOrder } from "@/redux/thunks/paymentsThunks"
import { toast } from "sonner"

type PaymentRecord = {
  id?: number
  orderId: number
  paymentAmount: number
  paymentDate?: string
  note?: string
}

export default function PaymentModal({
  open,
  onOpenChange,
  mode = "create",
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "view" | "edit"
  initial?: Partial<PaymentRecord>
  onSaved?: () => void
}) {
  const dispatch = useAppDispatch()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentRecord>({
    defaultValues: {
      orderId: initial?.orderId ?? 0,
      paymentAmount: initial?.paymentAmount ?? 0,
      paymentDate: initial?.paymentDate ? initial.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0],
      note: initial?.note ?? "",
    },
  })

  useEffect(() => {
    reset({
      orderId: initial?.orderId ?? 0,
      paymentAmount: initial?.paymentAmount ?? 0,
      paymentDate: initial?.paymentDate ? initial.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0],
      note: initial?.note ?? "",
    })
  }, [initial, reset])

  const onSubmit = async (values: PaymentRecord) => {
    try {
      if (mode === "create") {
        await dispatch(createPayment(values as any) as any)
        onSaved?.()
        onOpenChange(false)
        return
      }

      if (mode === "edit" && initial?.id) {
        // Only note is editable per requirements
        try {
          const res = await api.put(`/payments/${initial.id}`, { note: values.note })
          const successMsg = res?.data?.message ?? res?.data?.msg ?? "Payment updated"
          toast.success(String(successMsg))
          // refresh payments list for the order
          if (initial.orderId) await dispatch(fetchPaymentsForOrder(initial.orderId) as any)
          onSaved?.()
          onOpenChange(false)
          return
        } catch (err: any) {
          console.error(err)
          const apiMsg = err?.response?.data?.message ?? err?.response?.data?.msg ?? err?.message ?? "Failed to save payment"
          toast.error(`❗ ${String(apiMsg)}`, { action: { label: "Dismiss" } })
          onOpenChange(false)
          return
        }
      }
    } catch (e) {
      // createPayment thunk already shows toast on error; ensure modal closes same as success
      console.error(e)
      onOpenChange(false)
    }
  }

  const readOnly = mode === "view"
  const onlyNoteEditable = mode === "edit"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Payment" : mode === "edit" ? "Edit Payment" : "View Payment"}</DialogTitle>
          <DialogDescription>{mode === "create" ? "Record a payment" : "Payment details"}</DialogDescription>
        </DialogHeader>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Order ID</Label>
            <Input {...register("orderId", { valueAsNumber: true })} type="number" disabled={readOnly || onlyNoteEditable} aria-required={true} required />
          </div>
          <div>
            <Label>Amount <span className="text-destructive">*</span></Label>
            <Input {...register("paymentAmount", { valueAsNumber: true, validate: (v) => (v ?? 0) > 0 || "Amount must be greater than 0" })} type="number" step="0.01" disabled={readOnly || onlyNoteEditable} aria-required={true} aria-invalid={!!errors.paymentAmount} required />
            {errors.paymentAmount && (
              <p className="text-destructive text-sm mt-1">{String(errors.paymentAmount.message)}</p>
            )}
          </div>
          <div>
            <Label>Payment date <span className="text-destructive">*</span></Label>
            <Input {...register("paymentDate")} type="date" disabled={readOnly || onlyNoteEditable} aria-required={true} required />
          </div>
          <div>
            <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Input {...register("note")} disabled={readOnly ? true : false} placeholder="optional" />
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              {!readOnly && <Button type="submit">{mode === "create" ? "Create" : "Save"}</Button>}
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
