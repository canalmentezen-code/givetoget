"use client";

import useSWRInfinite from "swr/infinite";
import { ProjectPublic } from "@/types";

interface ProjectsPage {
  projects: ProjectPublic[];
  nextCursor: string | null;
}

interface Filters {
  niche?: string;
  techStack?: string;
  status?: string;
  search?: string;
  sortBy?: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  });

export function useProjects(filters: Filters = {}) {
  const getKey = (pageIndex: number, previousPageData: ProjectsPage | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;

    const params = new URLSearchParams();
    if (filters.niche) params.set("niche", filters.niche);
    if (filters.techStack) params.set("techStack", filters.techStack);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    params.set("limit", "20");

    if (pageIndex > 0 && previousPageData?.nextCursor) {
      params.set("cursor", previousPageData.nextCursor);
    }

    return `/api/projects?${params.toString()}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<ProjectsPage>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  const projects: ProjectPublic[] = data
    ? data.flatMap((page) => page.projects)
    : [];

  const hasMore = data
    ? data[data.length - 1]?.nextCursor !== null
    : false;

  const loadMore = () => setSize(size + 1);

  return {
    projects,
    hasMore,
    loadMore,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
