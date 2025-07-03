# NewsFlash 🌍📰

A modern, secure, and reliable news website built with Next.js and React. NewsFlash aggregates news from **6 trusted sources** to provide comprehensive, real-time news coverage with beautiful dark mode support.

## 🌟 Features

- **Multi-Source News Aggregation**: Combines news from 6 reliable APIs for maximum coverage
- **Real Publisher Names**: Shows actual news sources (CNN, BBC, Reuters, etc.)
- **Smart Deduplication**: Removes duplicate articles across sources
- **Country-Specific Filtering**: Get news relevant to specific countries
- **True Dark Mode**: Beautiful #000000 black theme
- **Weather Integration**: Live weather data
- **Performance Optimized**: LRU caching, parallel API calls, SSR-compatible
- **Security First**: No exposed API keys, comprehensive security measures

## 🗞️ News Sources

### Primary Sources (Recommended)
- **NewsData.io** - 200 requests/day free tier ⭐
- **NewsAPI.org** - 1,000 requests/day free tier ⭐

### Additional Sources (Optional)
- **The Guardian API** - 5,000 requests/day free tier
- **GNews** - 100 requests/day free tier
- **Currents API** - 600 requests/day free tier
- **NewsCatcher** - 1,000 requests/month free tier

## 🚀 Quick Start

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd newsflash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Get API keys** (see [NEWS_API_SETUP.md](./NEWS_API_SETUP.md) for detailed instructions):
   - Sign up for at least one news API
   - Add your keys to `.env`

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

The app requires at least one news API key. See [NEWS_API_SETUP.md](./NEWS_API_SETUP.md) for:
- Detailed signup instructions for each API
- Rate limits and quotas
- Recommended combinations
- Troubleshooting guide

## 🏗️ Built With

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **LRU Cache** - Performance optimization
- **Winston** - Structured logging

## 📁 Project Structure

```
├── app/                    # Next.js App Router
├── components/            # React components
├── lib/                   # Utilities and services
├── types/                 # TypeScript definitions
├── .env.example          # Environment template
├── NEWS_API_SETUP.md     # API setup guide
└── SECURITY.md           # Security documentation
```

## 🔒 Security

- ✅ No API keys exposed to client-side
- ✅ Environment variable validation
- ✅ Rate limiting and error handling
- ✅ Secure headers and CORS policies
- ✅ Input sanitization and validation

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

## 📊 Performance

- **Parallel API Calls**: Fetches from multiple sources simultaneously
- **LRU Caching**: 30-minute cache with 100 entry limit
- **Smart Deduplication**: Removes duplicate articles across sources
- **SSR Compatible**: Server-side rendering for better SEO
- **Rate Limit Respect**: Automatic rate limiting for each API

## 🌍 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Add environment variables
- Build with `npm run build`
- Serve the `.next` directory

## 👨‍💻 Author

**Mark de Graaff**
- GitHub: [@m-de-graaff](https://github.com/m-de-graaff)
- Repository: [NewsFlash](https://github.com/m-de-graaff/newsflash)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ by [Mark de Graaff](https://github.com/m-de-graaff) for reliable, secure news aggregation
