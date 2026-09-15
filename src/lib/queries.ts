import { queryOptions } from "@tanstack/react-query";

import { getCall, getProject, listApplications, listCalls, listProjects } from "./data.functions";

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const projectQuery = (slug: string) =>
  queryOptions({
    queryKey: ["project", slug],
    queryFn: () => getProject({ data: { slug } }),
  });

export const callsQuery = queryOptions({
  queryKey: ["calls"],
  queryFn: () => listCalls(),
});

export const callQuery = (slug: string) =>
  queryOptions({
    queryKey: ["call", slug],
    queryFn: () => getCall({ data: { slug } }),
  });

export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: () => listApplications(),
});
