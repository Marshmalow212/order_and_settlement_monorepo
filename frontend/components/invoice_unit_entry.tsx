"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"

const statusValues = ["pending", "partially_paid", "paid", "overdue", "archieve"] as const
const statusSchema = z.enum(statusValues)

export type InvoiceStatus = (typeof statusValues)[number]

export type InvoiceLineItem = {
  product_name: string
  quantity: string
  unit_price: string
}

export type InvoiceEntryValues = {
  customer: string
  status: InvoiceStatus
  order_total: number
  amount_paid: number
  amount_due: number
  due_date: string
  created_at?: string
  line_items?: InvoiceLineItem[]
}

type FormValues = {
  customer: string
  status: InvoiceStatus
  amount_paid: string
  due_date: string
  line_items: InvoiceLineItem[]
}

type InvoiceUnitEntryProps = {
  initialValues?: Partial<InvoiceEntryValues>
  mode?: "create" | "edit" | "view"
  onSubmit?: (values: InvoiceEntryValues) => void
  onCancel?: () => void
}

const lineItemSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required"),
  quantity: z.string().trim().min(1, "Quantity is required"),
  unit_price: z.string().trim().min(1, "Unit price is required"),
})

const invoiceEntrySchema = z.object({
  customer: z.string().trim().min(1, "Customer is required"),
  status: statusSchema,
  amount_paid: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? "0" : value),
    z.string().trim().min(1, "Amount paid is required")
  ),
  due_date: z.string().trim().min(1, "Due date is required"),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
})

const todayString = () => new Date().toISOString().split("T")[0]

export default function InvoiceUnitEntry({
  initialValues,
  mode = "create",
  onSubmit,
  onCancel,
}: InvoiceUnitEntryProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      z.object({
        customer: z.string().trim().min(1, "Customer is required"),
        status: statusSchema,
        amount_paid: z.string().trim().min(1, "Amount paid is required"),
        due_date: z.string().trim().min(1, "Due date is required"),
        line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
      })
    ),
    defaultValues: {
      customer: "",
      status: "pending",
      amount_paid: "0",
      due_date: todayString(),
      line_items: [{ product_name: "", quantity: "", unit_price: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "line_items" })
  const lineItems = watch("line_items") ?? []
  const nonEditableLines = mode === "edit" && initialValues && initialValues.status && initialValues.status !== "pending"

  useEffect(() => {
    reset({
      customer: initialValues?.customer ?? "",
      status: initialValues?.status ?? "pending",
      amount_paid: initialValues?.amount_paid?.toString() ?? "0",
      due_date: initialValues?.due_date ?? todayString(),
      line_items:
        initialValues?.line_items?.length
          ? initialValues.line_items.map((item) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
            }))
          : [{ product_name: "", quantity: "", unit_price: "" }],
    })
  }, [initialValues, reset])

  const orderTotal = useMemo(() => {
    return lineItems.reduce((total, item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unit_price)

      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return total
      }

      return total + quantity * unitPrice
    }, 0)
  }, [lineItems])

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

  const amountPaid = Number(watch("amount_paid") ?? 0)
  const amountDue = Math.max(orderTotal - amountPaid, 0)

  const submitForm = (values: FormValues) => {
    const parsed = invoiceEntrySchema.parse({
      customer: values.customer,
      status: values.status,
      amount_paid: values.amount_paid,
      due_date: values.due_date,
      line_items: values.line_items,
    })

    const total = parsed.line_items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unit_price)
    }, 0)

    const paid = Number(parsed.amount_paid)

    const result: any = {
      customer: parsed.customer,
      status: parsed.status,
      order_total: total,
      amount_paid: paid,
      amount_due: Math.max(total - paid, 0),
      due_date: parsed.due_date,
      created_at: new Date().toISOString(),
    }

    // If editing a non-pending order, avoid sending line_items (backend disallows replacements)
    if (!(mode === "edit" && initialValues && initialValues.status && initialValues.status !== "pending")) {
      result.line_items = parsed.line_items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    }

    onSubmit?.(result)
  }

  if (mode === "view") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="text-sm font-medium">{initialValues?.customer ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{initialValues?.status ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order total</p>
              <p className="text-sm font-medium">{initialValues?.order_total?.toFixed(2) ?? "0.00"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount paid</p>
              <p className="text-sm font-medium">{initialValues?.amount_paid?.toFixed(2) ?? "0.00"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount due</p>
              <p className="text-sm font-medium">{initialValues?.amount_due?.toFixed(2) ?? "0.00"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Due date</p>
              <p className="text-sm font-medium">{initialValues?.due_date ?? "—"}</p>
            </div>
          </div>

          {initialValues?.line_items?.length ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Line items</p>
              {initialValues.line_items.map((item, index) => (
                <div key={`${item.product_name}-${index}`} className="flex justify-between text-sm">
                  <span>{item.product_name}</span>
                  <span>{item.quantity} × {item.unit_price}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submitForm)}>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">Customer</label>
          <input
            {...register("customer")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="Acme Co."
          />
          {errors.customer ? <p className="mt-1 text-xs text-destructive">{errors.customer.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Due date</label>
          <input
            {...register("due_date")}
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          {errors.due_date ? <p className="mt-1 text-xs text-destructive">{errors.due_date.message}</p> : null}
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Order status</p>
          <span className="rounded-full bg-background px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            Pending
          </span>
        </div>
        <input type="hidden" {...register("status")} value="pending" />
      </div>

      <div className="space-y-3">
        <div className="pr-2">
          {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Line item {index + 1}</p>
              {fields.length > 1 && !nonEditableLines ? (
                <button type="button" className="text-xs text-destructive hover:underline" onClick={() => remove(index)}>
                  Remove
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.7fr_0.7fr_0.9fr]">
              <div>
                <label className="mb-1 block text-xs font-medium">Product name</label>
                <input
                  {...register(`line_items.${index}.product_name` as const)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  disabled={nonEditableLines}
                />
                {errors.line_items?.[index]?.product_name ? (
                  <p className="mt-1 text-xs text-destructive">{errors.line_items[index].product_name.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Quantity</label>
                <input
                  {...register(`line_items.${index}.quantity` as const)}
                  type="number"
                  min="1"
                  step="1"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  disabled={nonEditableLines}
                />
                {errors.line_items?.[index]?.quantity ? (
                  <p className="mt-1 text-xs text-destructive">{errors.line_items[index].quantity.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Unit price</label>
                <input
                  {...register(`line_items.${index}.unit_price` as const)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  disabled={nonEditableLines}
                />
                {errors.line_items?.[index]?.unit_price ? (
                  <p className="mt-1 text-xs text-destructive">{errors.line_items[index].unit_price.message}</p>
                ) : null}
              </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Line subtotal</span>
                <span className="font-medium">
                  {(() => {
                    const li = lineItems[index] ?? { quantity: "", unit_price: "" }
                    const subtotal = Number(li.quantity ?? 0) * Number(li.unit_price ?? 0)
                    return currency.format(Number.isFinite(subtotal) ? subtotal : 0)
                  })()}
                </span>
              </div>
          </div>
          ))}
        </div>
      </div>

      {!nonEditableLines ? (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ product_name: "", quantity: "", unit_price: "" })}
          >
            Add another item
          </Button>
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{currency.format(orderTotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Order total</span>
          <span className="font-medium">{currency.format(orderTotal)}</span>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="submit">{mode === "edit" ? "Save changes" : "Create order"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
