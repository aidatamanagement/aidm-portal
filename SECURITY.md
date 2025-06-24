# Security Configuration Guide

## Overview

This document outlines the security configuration for the AIDM Client Portal application. All sensitive credentials and API keys have been moved to environment variables to ensure they are not exposed in the codebase.

## Environment Variables

### Required Variables

The following environment variables must be set for the application to function properly:

#### Supabase Configuration
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `VITE_SUPABASE_FUNCTION_URL` - Base URL for Supabase Edge Functions

#### Application Environment
- `VITE_NODE_ENV` - Environment indicator (development/production)

### Environment Files

1. **`.env.example`** - Template file showing required variables (safe to commit)
2. **`.env`** - Development environment variables (DO NOT commit)
3. **`.env.production`** - Production environment variables (DO NOT commit)

## Setup Instructions

### Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual Supabase credentials in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_SUPABASE_FUNCTION_URL=https://your-project.supabase.co/functions/v1
   VITE_NODE_ENV=development
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Deployment

#### Vercel Deployment
1. Set environment variables in your Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all required `VITE_*` variables

#### Netlify Deployment
1. Set environment variables in your Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add all required `VITE_*` variables

#### Other Platforms
Ensure all `VITE_*` environment variables are set in your deployment platform's environment configuration.

## Security Best Practices

### Environment Variables
- ✅ **DO**: Use environment variables for all sensitive data
- ✅ **DO**: Keep `.env.example` updated with required variables
- ❌ **DON'T**: Commit `.env` files to version control
- ❌ **DON'T**: Hardcode credentials in source code
- ❌ **DON'T**: Share environment files via insecure channels

### Git Security
The following files are automatically ignored by Git:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `.env.production`
- `*.key`
- `*.pem`
- `secrets.json`

### Supabase Security
- **Row Level Security (RLS)**: Ensure RLS is enabled on all tables
- **Service Role Key**: Never expose the service role key in client-side code
- **Anonymous Key**: Safe to use in client-side code (already has limited permissions)
- **Edge Functions**: Use proper authentication for admin functions

## Credential Rotation

### When to Rotate
- If credentials are accidentally exposed
- On a regular schedule (quarterly recommended)
- When team members leave
- After security incidents

### How to Rotate
1. Generate new keys in Supabase dashboard
2. Update environment variables in all environments
3. Deploy updated configuration
4. Revoke old keys

## Monitoring and Alerts

### Recommended Monitoring
- Set up alerts for unauthorized access attempts
- Monitor Supabase usage patterns
- Track API key usage in Supabase dashboard
- Enable audit logging where available

### Security Headers
Consider implementing security headers in your deployment:
- Content Security Policy (CSP)
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options

## Emergency Response

### If Credentials Are Compromised
1. **Immediate**: Revoke exposed credentials in Supabase
2. **Generate**: New credentials
3. **Update**: All environment configurations
4. **Deploy**: Updated application
5. **Monitor**: For suspicious activity
6. **Document**: The incident for future reference

### Contact Information
- **Primary**: [Your security contact]
- **Backup**: [Backup security contact]
- **Supabase Support**: [Supabase support channel]

## Compliance Notes

- This configuration supports SOC 2 compliance requirements
- Environment variable isolation meets security framework standards
- Credential rotation procedures align with security best practices

---

**Last Updated**: [Current Date]
**Next Review**: [Review Date] 