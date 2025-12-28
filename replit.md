# Universal ID Card Generator

## Overview

A full-stack web application for generating universal-style national ID cards. Users can input personal information (name, date of birth, ID number, country, photo, signature) and generate ID cards in PNG and PDF formats. The system includes QR code-based verification, admin dashboard for card management, and configurable watermark settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: REST API with typed contracts defined in `shared/routes.ts`
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Multer for photo handling with file validation

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**:
  - `cards`: ID card records with personal info and generated asset URLs
  - `settings`: Admin watermark configuration
  - `templates`: Card layout templates (JSON config)
  - `users` and `sessions`: Authentication tables (required for Replit Auth)

### Asset Generation
- **QR Codes**: Generated via `qrcode` library, stored in `/uploads/qr/`
- **Card Images**: Canvas-based rendering via `node-canvas`
- **PDF Generation**: PDFKit for downloadable documents
- **Storage**: Static file serving from `/uploads/` directory

### Security Features
- **Security Headers Middleware**: Implements X-Frame-Options (DENY), X-Content-Type-Options (nosniff), X-XSS-Protection, HSTS, CSP, Referrer-Policy, and Permissions-Policy headers
- **Rate Limiting**: 30 requests per 15 minutes on `/api/verify` endpoint; 100 requests per hour on `/api/cards/create` endpoint
- **Input Validation & Sanitization**: Strict Zod schema validation, XSS prevention via angle bracket removal, SQL injection pattern detection
- **File Upload Security**: MIME type validation (JPEG, PNG, GIF, WebP only), file extension validation, filename character validation, 5MB size limit
- **Audit Logging**: Tracks all admin actions (card status updates, settings changes) with timestamp, user ID, and change details; stores last 1000 logs in memory
- **Request Size Limits**: 10MB limit on JSON and URL-encoded request bodies to prevent DoS attacks
- **Automatic Cleanup**: Rate limit and audit log cleanup runs hourly to prevent memory leaks

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including IDCardPreview, SignaturePad
    hooks/        # Custom hooks for auth, cards, settings
    pages/        # Route components (Home, Verify, Admin)
    lib/          # Utilities, country data, query client
server/           # Express backend
  middleware/     # Security, rate limiting, audit logging
  lib/            # Generator functions, validation
  replit_integrations/auth/  # Replit Auth integration
shared/           # Shared types and schemas
  schema.ts       # Drizzle table definitions
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations (`drizzle-kit push` for schema sync)

### Authentication
- **Replit Auth**: OpenID Connect integration requiring `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
- Session storage in PostgreSQL `sessions` table

### Key NPM Packages
- `canvas`: Server-side image generation for ID cards
- `qrcode`: QR code generation for verification URLs
- `pdfkit`: PDF document generation
- `html2canvas` / `jspdf`: Client-side export functionality
- `react-signature-canvas`: Signature capture component
- `multer`: File upload handling

### Static Assets
- Uploaded photos stored in `uploads/photos/`
- Generated QR codes in `uploads/qr/`
- Generated card images in `uploads/cards/`
- Generated PDFs in `uploads/pdfs/`