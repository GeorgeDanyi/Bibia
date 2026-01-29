# BIBIA Core Structure

## Overview
This document outlines the clean, minimal core structure for the BIBIA physiotherapy platform.

## Directory Structure

```
bibia-core/
├── core/                          # Core application code
│   ├── components/                # Reusable UI components
│   │   ├── ui/                   # Basic UI components (Button, Input, etc.)
│   │   ├── layout/               # Layout components (Header, Footer, etc.)
│   │   └── features/             # Feature-specific components
│   ├── lib/                      # Core libraries and utilities
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   └── config/               # Configuration files
│   ├── data/                     # Data and schemas
│   │   ├── fixtures/             # Mock data for development
│   │   └── schemas/              # Data validation schemas
│   └── styles/                   # Global styles and themes
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page
│   ├── status/                   # Status dashboard
│   ├── questionnaire/            # Questionnaire flow
│   └── results/                  # Search results
├── public/                       # Static assets
├── archive/                      # Archived legacy code
│   ├── legacy-docs/              # Old documentation
│   ├── legacy-scripts/           # Old scripts
│   └── legacy-components/        # Old components
└── package.json                  # Dependencies and scripts
```

## Core Features

### 1. Environment Configuration
- Centralized environment variable management
- Type-safe configuration
- Feature flags support
- Development/production modes

### 2. Status Dashboard
- Build information display
- Feature flag status
- Data health monitoring
- UX toggle controls

### 3. Component System
- Minimal, reusable UI components
- Consistent styling with Tailwind CSS
- TypeScript support
- Accessibility considerations

### 4. Data Management
- Mock data for development
- Type-safe data schemas
- Validation utilities
- Fixture management

## Key Files

### Configuration
- `core/lib/config/env.ts` - Environment configuration
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies and scripts

### Types
- `core/lib/types/index.ts` - Core TypeScript types
- `core/data/schemas/questionnaire.ts` - Questionnaire schemas

### Components
- `core/components/ui/Button.tsx` - Basic button component
- `app/status/page.tsx` - Status dashboard

### Data
- `core/data/fixtures/therapists.json` - Mock therapist data
- `core/data/schemas/questionnaire.ts` - Questionnaire options

## Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_NAME="BIBIA"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_ENV="development"

# Feature Flags
NEXT_PUBLIC_FEATURE_QUESTIONNAIRE_V2="true"
NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH="false"
NEXT_PUBLIC_FEATURE_ANALYTICS="false"

# Data Sources
NEXT_PUBLIC_USE_MOCK_DATA="true"
NEXT_PUBLIC_DATA_SOURCE="fixtures"

# Development
NEXT_PUBLIC_DEBUG_MODE="true"
NEXT_PUBLIC_SHOW_STATUS_PAGE="true"
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Status Dashboard**
   - Navigate to `/status` to view system health
   - Check feature flags and data sources
   - Monitor build information

3. **Add New Features**
   - Create components in `core/components/`
   - Add types in `core/lib/types/`
   - Update schemas in `core/data/schemas/`

4. **Environment Management**
   - Copy `.env.example` to `.env.local`
   - Configure environment variables
   - Use feature flags for gradual rollouts

## Migration from Legacy

The legacy code has been archived in the `archive/` directory:
- Documentation moved to `archive/legacy-docs/`
- Scripts moved to `archive/legacy-scripts/`
- Old components moved to `archive/legacy-components/`

This ensures a clean baseline while preserving historical code for reference.

## Next Steps

1. Test the status page at `/status`
2. Verify all feature flags work correctly
3. Add new features using the core structure
4. Gradually migrate essential functionality from archive
5. Set up proper environment configuration for production
