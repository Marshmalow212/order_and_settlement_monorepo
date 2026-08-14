"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

export function SectionCards(data: any) {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (data?.data) {
      setSummary(data?.data);
    }
  }, [data])

  function moneyFormat(num: number) {
    return num.toFixed(2);
  }
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${moneyFormat(summary?.paymentsTotalAmount ?? 0)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${moneyFormat(summary?.ordersTotalAmount ?? 0)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Orders Created</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary?.ordersCount ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center justify-between space-y-0">
            <div>
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {summary?.ordersPending ?? 0}
              </CardTitle>
            </div>
            <div>
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {summary?.ordersPaid ?? 0}
              </CardTitle>
            </div>
            <div>
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {summary?.orderOverdue ?? 0}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase{" "}
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter> */}
      </Card>
    </div>
  )
}
