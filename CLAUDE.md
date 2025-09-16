# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YKS (Turkish university entrance exam) question management application built with:
- **Next.js 15** with App Router and Turbopack
- **Supabase** for database and file storage
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (New York style)
- **Zustand** for state management
- **Lucide React** for icons

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture Overview

### Database Layer (`lib/database.ts`)
- `DatabaseService` class provides static methods for all database operations
- Uses Supabase client for PostgreSQL operations
- Handles questions CRUD, filtering, search, and statistics
- All methods return `{ data, error }` pattern for consistent error handling

### State Management (`lib/store.ts`)
- Zustand store (`useQuestionStore`) manages global application state
- Handles questions list, filters, loading states, and current question
- Provides async actions for database operations with optimistic updates
- Error messages are in Turkish (`"Sorular yüklenirken hata oluştu"`)

### Type System (`lib/types.ts`)
- Core types: `Question`, `QuestionFormData`, `FilterOptions`
- Subject enum includes Turkish academic subjects
- `SUBJECT_LABELS` provides Turkish translations for UI
- Difficulty levels are 1-5 scale

### Database Schema (`lib/database.sql`)
- PostgreSQL with Turkish full-text search support
- RLS enabled with development-friendly policies
- Separate storage buckets for images and thumbnails
- Optimized indexes for common query patterns

### File Structure
```
app/                    # Next.js App Router pages
components/ui/          # shadcn/ui components
lib/                    # Core business logic and utilities
  ├── database.ts       # Supabase database service
  ├── store.ts          # Zustand state management
  ├── types.ts          # TypeScript type definitions
  ├── utils.ts          # Utility functions (cn helper)
  └── *.ts              # Other services (storage, image-processing)
utils/supabase/         # Supabase configuration
```

## Key Development Patterns

### Component Aliases (components.json)
- `@/components` → components directory
- `@/lib` → lib directory
- `@/utils` → utils directory
- `@/hooks` → hooks directory

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Database Operations Pattern
```typescript
// All database methods follow this pattern:
const { data, error } = await DatabaseService.getQuestions(filters);
if (error) {
  // Handle error
  return;
}
// Use data
```

### State Management Pattern
```typescript
// Access store state and actions
const { questions, loading, loadQuestions } = useQuestionStore();

// Actions automatically handle loading states and errors
await loadQuestions(filters);
```

## Technology Specifics

- **Turbopack**: Used for both dev and build for faster compilation
- **ESLint**: Configured with Next.js and TypeScript rules
- **TypeScript**: Strict mode with absolute imports via `@/*` paths
- **Tailwind**: Version 4 with CSS variables for theming
- **shadcn/ui**: New York style variant with Lucide icons

## File Processing
The application handles question images with thumbnail generation (see `lib/image-processing.ts` and `lib/storage.ts`).

## Language Context
This is a Turkish application - error messages, UI labels, and database content use Turkish language. When adding features, maintain Turkish language consistency for user-facing text.