# FreelanceTracker Pro

## Overview

FreelanceTracker Pro is a comprehensive freelance business automation platform built with React, TypeScript, and Express.js. The application provides time tracking, client management, project management, invoice/quote generation, document management, and A/B testing capabilities for professional freelancers. It features role-based access control with admin, freelancer, and client roles, Replit authentication integration, and payment processing through Stripe, Cashfree, and PayPal.

## Recent Changes

**Payment Gateway Migration (January 2025):**
- Replaced PayPal with Cashfree as the primary payment gateway for Indian market support
- Integrated Cashfree Payment Gateway SDK with test credentials
- Added comprehensive payment checkout flow with order creation and status tracking
- Implemented secure webhook handling for payment confirmations
- Created dedicated checkout page with payment testing capabilities
- Updated payment configuration UI to support Cashfree API key management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit OpenID Connect (OIDC) with Passport.js strategy
- **Session Management**: Express sessions with PostgreSQL session store
- **File Structure**: Monorepo with shared schema between client and server

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL sessions table for authentication persistence
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Connection Pooling**: Neon serverless connection pooling with WebSocket support

### Authentication and Authorization
- **Authentication Provider**: Replit OIDC integration for secure user authentication
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Role-Based Access**: Three-tier role system (admin, freelancer, client)
- **Route Protection**: Middleware-based route protection with role verification
- **Activity Logging**: Comprehensive audit trail for user actions and system events

### Security Features
- **Data Encryption**: AES-256-GCM encryption for sensitive data storage
- **Environment Variables**: Secure configuration management for API keys and secrets
- **Input Validation**: Zod schema validation on both client and server
- **CSRF Protection**: Session-based CSRF protection for form submissions

## External Dependencies

### Authentication Services
- **Replit OIDC**: Primary authentication provider using OpenID Connect
- **Passport.js**: Authentication middleware with OpenID Client strategy

### Payment Processing
- **Stripe**: Credit card processing with React Stripe.js integration
- **Cashfree**: Indian payment gateway integration with comprehensive payment methods
- **PayPal**: Alternative payment processing via PayPal Server SDK (legacy support)

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

### UI and Development Tools
- **Shadcn/ui**: Pre-built accessible component library
- **Radix UI**: Headless UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TanStack Query**: Server state management and caching

### PDF and Document Generation
- **PDFKit**: Server-side PDF generation for invoices and quotes
- **File System**: Node.js fs module for document storage and management

### Development Infrastructure
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Static type checking across the entire application
- **ESLint/Prettier**: Code quality and formatting tools