import { api } from "@/redux/apiClient"
import { setAuditLogs, setLoading, setError } from "@/redux/reducers/auditLogs"
import type { AppDispatch } from "@/redux/store"

// Fetch all audit logs
export const fetchAllAuditLogs = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/audit-logs`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch audit logs"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setAuditLogs(res.data))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch audit logs"))
    dispatch(setLoading(false))
    return null
  }
}

// Fetch audit logs for a specific order
export const fetchAuditLogsForOrder = (orderId: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/audit-logs/order/${orderId}`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch audit logs for order"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setAuditLogs(res.data))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch audit logs for order"))
    dispatch(setLoading(false))
    return null
  }
}

// Fetch single audit log by id (details view)
export const fetchAuditLogById = (id: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/audit-logs/${id}`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch audit log"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch audit log"))
    dispatch(setLoading(false))
    return null
  }
}

export const fetchAuditLogsForUser = (userId: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true))
    const res = await api.get(`/audit-logs/user/${userId}`)
    if ((res as any)?.error) {
      const apiMsg = (res as any)?.data?.message ?? "Failed to fetch audit logs"
      dispatch(setError(apiMsg))
      dispatch(setLoading(false))
      return null
    }
    dispatch(setAuditLogs(res.data))
    dispatch(setLoading(false))
    return res.data
  } catch (err: any) {
    dispatch(setError(err?.message ?? "Failed to fetch audit logs"))
    dispatch(setLoading(false))
    return null
  }
}

// NOTE: creation/updating/deleting audit logs is intentionally disabled.
// Only read thunks are supported: use `fetchAllAuditLogs`, `fetchAuditLogsForOrder`,
// `fetchAuditLogById`, and `fetchAuditLogsForUser`.
