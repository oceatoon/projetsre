import { queryOptions } from "@tanstack/react-query";
import { listFunderLinks as listFunderLinksFn } from "./data.functions";

import { getCall, getProject, listApplications, listCalls, listProjects } from "./data.functions";
import { getCooperation } from "./coop.functions";
import { getPublicProfile } from "./profiles.functions";

export const profileQuery = (handle: string) =>
  queryOptions({
    queryKey: ["profile", handle],
    queryFn: () => getPublicProfile({ data: { handle } }),
  });

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

export const cooperationQuery = (slugA: string, slugB: string) =>
  queryOptions({
    queryKey: ["cooperation", slugA, slugB],
    queryFn: () => getCooperation({ data: { slugA, slugB } }),
  });

export const funderLinksQuery = queryOptions({
  queryKey: ["funder-links"],
  queryFn: () => listFunderLinksFn(),
});
