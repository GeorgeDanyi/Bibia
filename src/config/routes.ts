// Central routes configuration - all route strings must be defined here
export const ROUTES = {
  questionnaire: "/questionnaire",
  results: "/results",
  therapistDetail: (id: string) => `/therapists/${id}`,
} as const

// Type for route values
export type RouteValue = typeof ROUTES[keyof typeof ROUTES] | string

// Helper function to ensure routes are used correctly
export function getRoute(route: keyof typeof ROUTES): string {
  const routeValue = ROUTES[route]
  if (typeof routeValue === 'function') {
    throw new Error(`Route '${route}' is a function and requires parameters`)
  }
  return routeValue
}

// Helper function for dynamic routes (currently supports single-parameter routes)
export function getDynamicRoute(route: keyof typeof ROUTES, param: string): string {
  const routeValue = ROUTES[route]
  if (typeof routeValue === 'function') {
    return routeValue(param)
  }
  return routeValue
}

// Validation function to ensure no raw route strings are used
export function validateRoute(route: string): boolean {
  const allRoutes = Object.values(ROUTES).flatMap(route => {
    if (typeof route === 'function') {
      return [] // Skip functions
    }
    if (typeof route === 'object') {
      return Object.values(route)
    }
    return [route]
  })
  
  return allRoutes.includes(route)
}


