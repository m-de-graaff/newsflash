# Security Guidelines for NewsFlash

## 🔐 Environment Variables

### Required API Keys
This application requires two API keys to function:

1. **NewsData.io API Key**
   - Sign up at: https://newsdata.io/
   - Set as: `NEWSDATA_API_KEY=your_key_here`

2. **NewsAPI.org API Key** 
   - Sign up at: https://newsapi.org/
   - Set as: `NEWSAPI_KEY=your_key_here`

### Setup Instructions
1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual API keys
3. Never commit `.env` files to version control

## 🚨 Security Best Practices

### API Key Protection
- ✅ API keys are loaded from environment variables only
- ✅ No hardcoded keys in source code
- ✅ `.env` files are gitignored
- ✅ Configuration validation ensures keys are present

### Rate Limiting
- Daily limits: 180 requests (NewsData.io free tier)
- Hourly limits: 8 requests to prevent abuse
- Automatic rate limit tracking and enforcement

### Error Handling
- Sensitive information is not exposed in error messages
- Structured logging without exposing secrets
- Graceful fallbacks when APIs are unavailable

## 🔄 Deployment Considerations

### Environment Variables in Production
Set these environment variables in your deployment platform:

```bash
NEWSDATA_API_KEY=your_actual_newsdata_key
NEWSAPI_KEY=your_actual_newsapi_key
NEWSDATA_DAILY_LIMIT=180
NEWSDATA_HOURLY_LIMIT=8
CACHE_DURATION=1800000
CACHE_MAX_ENTRIES=100
LOG_LEVEL=INFO
```

### Security Headers
Consider adding these security headers in production:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## 🚨 What NOT to Do

❌ Never commit API keys to version control
❌ Never hardcode secrets in source code  
❌ Never log sensitive information
❌ Never expose API keys in client-side code
❌ Never share `.env` files

## ✅ Security Checklist

- [x] API keys stored in environment variables
- [x] No hardcoded secrets in code
- [x] `.env` files gitignored
- [x] Configuration validation
- [x] Rate limiting implemented
- [x] Error handling doesn't expose secrets
- [x] Structured logging without sensitive data
- [x] Secure HTTPS-only API requests
- [x] Input validation and sanitization
- [x] CORS properly configured

## 🔍 Additional Security Recommendations

### For Production Deployments
- Enable security headers in your deployment platform
- Use environment-specific configurations
- Monitor API usage and implement alerting
- Regular security audits of dependencies
- Enable rate limiting at the infrastructure level

### Development Best Practices
- Use different API keys for development and production
- Regularly rotate API keys
- Monitor for leaked credentials in version control
- Use `.env.local` for local development overrides

---

**Developed by [Mark de Graaff](https://github.com/m-de-graaff/newsflash)**
