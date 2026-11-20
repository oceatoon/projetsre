import { T, useTranslation } from "@/components/language-provider";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/language-provider";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  useTranslation();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-semibold">404</h1>
        <h2 className="mt-4 text-xl font-semibold"><T>{"Page introuvable"}</T></h2>
        <p className="mt-2 text-sm text-muted-foreground"><T>{" Cette page n'existe pas ou a été déplacée. "}</T></p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          ><T>{" Retour à l'accueil "}</T></Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  useTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold"><T>{"Cette page n'a pas pu s'afficher"}</T></h1>
        <p className="mt-2 text-sm text-muted-foreground"><T>{" Vous pouvez réessayer ou revenir à l'accueil. "}</T></p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          ><T>{" Réessayer "}</T></button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          ><T>{" Accueil "}</T></a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "projets.re — les projets du territoire réunionnais" },
      {
        name: "description",
        content:
          "Déposez votre projet une seule fois, faites-le mûrir avec l'aide de l'IA et répondez à plusieurs appels à projets à La Réunion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  useTranslation();
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <T>{children}</T>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useTranslation();
  const { queryClient } = Route.useRouteContext();
  const isPresentation = useRouterState({ select: (state) => state.location.pathname === "/presentation" });

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <div className="flex min-h-screen flex-col">
        <T>{!isPresentation ? <SiteHeader /> : null}</T>
        <main className="flex-1">
          <Outlet />
        </main>
        <T>{!isPresentation ? <SiteFooter /> : null}</T>
      </div>
      <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
