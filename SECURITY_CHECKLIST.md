# 🔐 Security Checklist

Use this checklist to ensure your AIDM Client Portal is properly secured.

## ✅ Environment Setup

### Local Development
- [ ] Copied `.env.example` to `.env`
- [ ] Filled in all required `VITE_*` environment variables
- [ ] Verified `.env` is listed in `.gitignore`
- [ ] Confirmed build works with `npm run build`
- [ ] Application starts without hardcoded credential warnings

### Production Deployment
- [ ] Environment variables set in deployment platform
- [ ] All `VITE_*` variables configured
- [ ] No `.env` files deployed to production
- [ ] Build succeeds in deployment environment
- [ ] Application functions properly with environment variables

## ✅ Code Security

### Credentials
- [ ] No hardcoded URLs in source code
- [ ] No API keys in source code
- [ ] No passwords in source code
- [ ] All Supabase calls use environment variables
- [ ] Edge function URLs use environment variables

### File Security
- [ ] `.env` files in `.gitignore`
- [ ] No sensitive files committed
- [ ] `SECURITY.md` documentation present
- [ ] TypeScript environment declarations added

## ✅ Git Security

### Repository
- [ ] No credentials in commit history
- [ ] `.gitignore` properly configured
- [ ] Security files documented
- [ ] No sensitive data in README

### Access Control
- [ ] Repository access properly managed
- [ ] SSH keys secured
- [ ] Branch protection rules in place (if applicable)

## ✅ Supabase Security

### Database
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Service role key never exposed client-side
- [ ] Anonymous key permissions properly scoped
- [ ] Database policies tested

### Authentication
- [ ] Auth flows working properly
- [ ] Admin permissions verified
- [ ] User roles functioning correctly
- [ ] Session management secure

### Edge Functions
- [ ] Proper authentication checks
- [ ] Admin-only functions protected
- [ ] Error handling doesn't expose internals
- [ ] CORS properly configured

## ✅ Deployment Security

### Environment Variables
- [ ] All required variables set
- [ ] Variables match between environments
- [ ] No credentials in build logs
- [ ] Environment-specific configurations correct

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Security alerts set up (if available)
- [ ] Access logs monitored

## ✅ Operational Security

### Credential Management
- [ ] Credentials rotation schedule established
- [ ] Backup access procedures documented
- [ ] Emergency response plan ready
- [ ] Team access properly managed

### Documentation
- [ ] `SECURITY.md` complete and current
- [ ] Setup instructions clear
- [ ] Emergency procedures documented
- [ ] Contact information updated

## 🚨 Red Flags

Immediately address if any of these are true:

- [ ] ❌ Credentials visible in source code
- [ ] ❌ `.env` files committed to Git
- [ ] ❌ Hardcoded URLs in production
- [ ] ❌ Service role key in client code
- [ ] ❌ No environment variables set
- [ ] ❌ Build fails with current configuration

## 📝 Sign-off

### Developer Checklist
- [ ] All security requirements met
- [ ] Code reviewed for security issues
- [ ] Environment properly configured
- [ ] Documentation updated

**Developer**: ________________  
**Date**: ________________

### Deployment Checklist
- [ ] Production environment secured
- [ ] All variables properly set
- [ ] Security policies verified
- [ ] Monitoring configured

**DevOps/Deployer**: ________________  
**Date**: ________________

---

**Security Contact**: [Your security contact]  
**Last Updated**: [Current Date] 