"use client";

import { useState } from "react";
import { AccessRequestStatus } from "@/types";

interface AccessRequestState {
  status: AccessRequestStatus | null;
  requestId: string | null;
  loading: boolean;
  error: string | null;
}

export function useAccessRequest(projectId: string) {
  const [state, setState] = useState<AccessRequestState>({
    status: null,
    requestId: null,
    loading: false,
    error: null,
  });

  const requestAccess = async (message: string = "") => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch(`/api/projects/${projectId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, error: data.error }));
        return;
      }

      setState({
        status: "pending",
        requestId: data.requestId,
        loading: false,
        error: null,
      });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  return { ...state, requestAccess };
}
