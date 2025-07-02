# News API Configuration Guide

NewsFlash now supports **6 reliable news sources** to ensure maximum coverage and reliability. You need at least one API key, but having multiple sources provides better redundancy and coverage.

## Primary Sources (Recommended)

### 1. NewsData.io ⭐
- **Website**: https://newsdata.io/
- **Free Tier**: 200 requests/day
- **Signup**: Create account → Get API key
- **Quality**: High-quality news from verified sources
- **Coverage**: Global, excellent categorization
- **Env Variable**: `NEWSDATA_API_KEY`

### 2. NewsAPI.org ⭐
- **Website**: https://newsapi.org/
- **Free Tier**: 1,000 requests/day (development only)
- **Signup**: Create account → Get API key
- **Quality**: Excellent source diversity
- **Coverage**: Global, real publisher names
- **Env Variable**: `NEWSAPI_KEY`

## Additional Sources (Optional but Recommended)

### 3. The Guardian API ⭐
- **Website**: https://open-platform.theguardian.com/
- **Free Tier**: 5,000 requests/day
- **Signup**: Register → Request API key
- **Quality**: Premium news source
- **Coverage**: UK-focused, international news
- **Env Variable**: `GUARDIAN_API_KEY`

### 4. GNews
- **Website**: https://gnews.io/
- **Free Tier**: 100 requests/day
- **Signup**: Create account → Get API key
- **Quality**: Good aggregation
- **Coverage**: Global news aggregation
- **Env Variable**: `GNEWS_API_KEY`

### 5. Currents API
- **Website**: https://currentsapi.services/
- **Free Tier**: 600 requests/day
- **Signup**: Register → Get API key
- **Quality**: Reliable source
- **Coverage**: Global, categorized news
- **Env Variable**: `CURRENTS_API_KEY`

### 6. NewsCatcher (NewsWeb)
- **Website**: https://newscatcherapi.com/
- **Free Tier**: 1,000 requests/month
- **Signup**: Create account → Get API key
- **Quality**: Good source diversity
- **Coverage**: Global news aggregation
- **Env Variable**: `NEWSWEB_API_KEY`

## Setup Instructions

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Get at least one API key** from the sources above (NewsData.io and NewsAPI.org are recommended)

3. **Update your `.env` file**:
   ```bash
   # At least one of these is required
   NEWSDATA_API_KEY=your_actual_newsdata_key
   NEWSAPI_KEY=your_actual_newsapi_key
   
   # Optional - add for better coverage
   GUARDIAN_API_KEY=your_guardian_key
   GNEWS_API_KEY=your_gnews_key
   CURRENTS_API_KEY=your_currents_key
   NEWSWEB_API_KEY=your_newscatcher_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## API Key Priority

The system will automatically:
- ✅ Use all available API keys in parallel
- ✅ Fall back gracefully if some APIs fail
- ✅ Combine and deduplicate results from all sources
- ✅ Show real publisher names (CNN, BBC, Reuters, etc.)
- ✅ Respect rate limits for each API

## Rate Limits & Quotas

| Source | Free Requests | Reset Period | Notes |
|--------|---------------|--------------|-------|
| NewsData.io | 200/day | Daily | Best free tier |
| NewsAPI.org | 1,000/day | Daily | Dev only, paid for production |
| Guardian | 5,000/day | Daily | Excellent free tier |
| GNews | 100/day | Daily | Limited but reliable |
| Currents | 600/day | Daily | Good balance |
| NewsCatcher | 1,000/month | Monthly | Lowest quota |

## Recommended Setup

**For Development**:
- NewsData.io + NewsAPI.org + Guardian API

**For Production**:
- NewsData.io + Guardian API + Currents API (all have good production tiers)

## Troubleshooting

1. **"No API keys configured" error**:
   - Make sure at least one API key is set in your `.env` file
   - Restart the development server after adding keys

2. **Rate limit errors**:
   - The system automatically handles rate limits
   - Consider adding more API sources for higher traffic

3. **No news results**:
   - Check that your API keys are valid
   - Check the browser console for API errors
   - Verify your `.env` file is in the project root

## Security Notes

- ✅ Never commit `.env` files to version control
- ✅ All API keys are properly hidden from client-side code
- ✅ Use environment variables in production deployments
- ✅ Regularly rotate your API keys for security
