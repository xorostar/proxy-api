# Rate Limiting Scraper API

A simple web scraping API that rotates through free proxies with rate limiting.

## What it does

- Scrapes URLs using rotating proxies from `proxies.json`
- Limits requests per proxy using Redis
- Returns 429 when all proxies are rate limited
- Returns 500 if scraping fails after 3 retries
- Maximum of 3 Retries with different proxies on failure

## Quick Start

1. **Install & run:**

```bash
docker compose up --build
```

2. **Test it:**

```bash
# Health check
curl http://localhost:3000/api/health

# Scrape a URL
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/html"}'
```

## API

**POST /api/scraper/scrape**

```json
{
  "url": "https://example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "html": "<html>...</html>",
    "headers": {...},
    "statusCode": 200,
    "proxy": {"ip": "173.209.63.70", "port": 8040}
  }
}
```

**Rate Limited (429):**

```json
{
  "success": false,
  "error": "You have hit the rate limit on all proxies",
  "statusCode": 429
}
```

## Configuration

**Environment:**

```env
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
```

**Proxies (`proxies.json`):**

```json
{
  "proxies": [
    {
      "ip_address": "173.209.63.70",
      "port": 8040,
      "requests_per_second": 3
    }
  ]
}
```

## Development

```bash
npm run dev      # Development server
npm test         # Run tests
npm run build    # Build for production
```

## How it works

1. **Proxy Selection**: Randomly picks a proxy that's not rate limited
2. **Rate Limiting**: Tracks requests per proxy in Redis (1-second TTL)
3. **Retry Logic**: If a proxy fails, tries another one
4. **429 Response**: When all proxies are rate limited, returns 429
