// Environment configuration for BIBIA
// This centralizes all environment variables and provides type safety

export const env = {
  // Application
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "BIBIA",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "development",
  
  // Feature Flags
  FEATURES: {
    QUESTIONNAIRE_V2: process.env.NEXT_PUBLIC_FEATURE_QUESTIONNAIRE_V2 === "true",
    ADVANCED_SEARCH: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH === "true",
    ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "true",
  },
  
  // Data Sources
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true",
  DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE || "fixtures",
  
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  API_SECRET_KEY: process.env.API_SECRET_KEY,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SECRET: process.env.DATABASE_SECRET,
  
  // Third-party Services
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  ANALYTICS_ID: process.env.ANALYTICS_ID,
  
  // Development
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  SHOW_STATUS_PAGE: process.env.NEXT_PUBLIC_SHOW_STATUS_PAGE === "true",
} as const

export type EnvConfig = typeof env
