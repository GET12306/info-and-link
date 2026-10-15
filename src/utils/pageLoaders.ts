/** Share pending imports between navigation preloading and React.lazy. Retry failed preloads. */
export function createPageLoader<T>(load: () => Promise<T>) {
  let pending: Promise<T> | undefined
  return () => {
    pending ??= load().catch((error) => {
      pending = undefined
      throw error
    })
    return pending
  }
}

export const pageLoaders = {
  home: createPageLoader(() => import("../pages/Home")),
  activities: createPageLoader(() => import("../pages/Activities")),
  tickets: createPageLoader(() => import("../pages/TicketInfo")),
  museum: createPageLoader(() => import("../pages/Museum")),
  credits: createPageLoader(() => import("../pages/Credits")),
  pastActivities: createPageLoader(() => import("../pages/PastActivities")),
  programs: createPageLoader(() => import("../pages/Programs")),
  media: createPageLoader(() => import("../pages/Media")),
  dailyPosts: createPageLoader(() => import("../pages/DailyPosts")),
  archivedAccounts: createPageLoader(() => import("../pages/ArchivedAccounts")),
  about: createPageLoader(() => import("../pages/About")),
  venueDetails: createPageLoader(() => import("../pages/VenueDetails")),
}

const routes: Record<string, () => Promise<unknown>> = {
  "/": pageLoaders.home,
  "/activities": pageLoaders.activities,
  "/tickets": pageLoaders.tickets,
  "/museum": pageLoaders.museum,
  "/museum/credits": pageLoaders.credits,
  "/museum/activities": pageLoaders.pastActivities,
  "/museum/programs": pageLoaders.programs,
  "/museum/media": pageLoaders.media,
  "/museum/daily-posts": pageLoaders.dailyPosts,
  "/museum/accounts": pageLoaders.archivedAccounts,
  "/about": pageLoaders.about,
}

export function preloadPage(pathname: string) {
  const load = pathname.startsWith("/venues/") ? pageLoaders.venueDetails : routes[pathname]
  // Speculative loading must not interrupt the outgoing page or produce unhandled rejections.
  return load?.().catch(() => undefined)
}
