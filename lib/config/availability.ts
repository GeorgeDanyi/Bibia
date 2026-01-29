// Availability system configuration
// Allows easy switching between mock and real calendar implementations

export interface AvailabilityConfig {
  // Service configuration
  useRealCalendars: boolean;
  fallbackToMock: boolean;
  cacheTimeout: number; // milliseconds
  
  // Display configuration
  maxDisplayDays: number; // Cap for display (prevents "419 days")
  showAbsurdValues: boolean; // Whether to show very high day counts
  
  // Scoring configuration
  asapBoostDays: number; // Days threshold for "Co nejdřív" boost
  asapBoostMultiplier: number; // Boost multiplier (1.1 = +10%)
  
  // Real calendar configuration (future)
  calendarProviders: {
    google: boolean;
    outlook: boolean;
    apple: boolean;
  };
  
  // Mock data configuration
  mockData: {
    maxDays: number; // Maximum days in mock data
    realisticDistribution: boolean; // Use realistic day distribution
  };
}

// Default configuration
export const defaultAvailabilityConfig: AvailabilityConfig = {
  // Service configuration
  useRealCalendars: false, // Start with mock data
  fallbackToMock: true,    // Fallback to mock if real calendars fail
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  
  // Display configuration
  maxDisplayDays: 30, // Cap at 30 days maximum
  showAbsurdValues: false, // Never show absurd values
  
  // Scoring configuration
  asapBoostDays: 7, // Boost for therapists available within 7 days
  asapBoostMultiplier: 1.1, // +10% boost
  
  // Real calendar configuration
  calendarProviders: {
    google: false,
    outlook: false,
    apple: false
  },
  
  // Mock data configuration
  mockData: {
    maxDays: 30, // Maximum days in mock data
    realisticDistribution: true // Use realistic day distribution
  }
};

// Production configuration (real calendars)
export const productionAvailabilityConfig: AvailabilityConfig = {
  ...defaultAvailabilityConfig,
  useRealCalendars: true,
  fallbackToMock: true,
  cacheTimeout: 2 * 60 * 1000, // 2 minutes cache for real data
  calendarProviders: {
    google: true,
    outlook: true,
    apple: true
  }
};

// Development configuration (mock data)
export const developmentAvailabilityConfig: AvailabilityConfig = {
  ...defaultAvailabilityConfig,
  useRealCalendars: false,
  fallbackToMock: true,
  cacheTimeout: 10 * 60 * 1000, // 10 minutes cache for mock data
  mockData: {
    maxDays: 30,
    realisticDistribution: true
  }
};

// Test configuration
export const testAvailabilityConfig: AvailabilityConfig = {
  ...defaultAvailabilityConfig,
  useRealCalendars: false,
  fallbackToMock: false, // No fallback in tests
  cacheTimeout: 0, // No cache in tests
  mockData: {
    maxDays: 7, // Shorter range for tests
    realisticDistribution: false // Predictable distribution for tests
  }
};

// Get current configuration based on environment
export function getCurrentAvailabilityConfig(): AvailabilityConfig {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return productionAvailabilityConfig;
    case 'test':
      return testAvailabilityConfig;
    default:
      return developmentAvailabilityConfig;
  }
}

// Configuration validation
export function validateAvailabilityConfig(config: AvailabilityConfig): string[] {
  const errors: string[] = [];
  
  if (config.maxDisplayDays < 1) {
    errors.push('maxDisplayDays must be at least 1');
  }
  
  if (config.asapBoostDays < 0) {
    errors.push('asapBoostDays must be non-negative');
  }
  
  if (config.asapBoostMultiplier < 1.0) {
    errors.push('asapBoostMultiplier must be at least 1.0');
  }
  
  if (config.cacheTimeout < 0) {
    errors.push('cacheTimeout must be non-negative');
  }
  
  if (config.mockData.maxDays < 1) {
    errors.push('mockData.maxDays must be at least 1');
  }
  
  return errors;
}

// Update configuration at runtime
export function updateAvailabilityConfig(
  currentConfig: AvailabilityConfig,
  updates: Partial<AvailabilityConfig>
): AvailabilityConfig {
  const newConfig = { ...currentConfig, ...updates };
  const errors = validateAvailabilityConfig(newConfig);
  
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(', ')}`);
  }
  
  return newConfig;
}
