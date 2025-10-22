# CORS Proxy Configuration

This RSS AI Reader uses AllOrigins as a CORS proxy service to handle cross-origin requests when fetching RSS feeds.

## Current Setup

The application uses **AllOrigins** (`https://api.allorigins.win/raw`) as the CORS proxy service for both development and production.

### Why AllOrigins?

- ✅ **Reliable**: High uptime and good performance
- ✅ **Free**: No cost for reasonable usage
- ✅ **Simple**: No complex configuration needed
- ✅ **Widely used**: Trusted by many applications
- ✅ **Rate limits**: 100 requests/hour (sufficient for most use cases)

## How It Works

1. **RSS Request**: When you select a feed, the app makes a request to AllOrigins
2. **CORS Proxy**: AllOrigins fetches the RSS feed on your behalf
3. **Response**: The RSS XML is returned to the app without CORS issues
4. **Parsing**: The app parses the XML and displays the articles

## Future: Self-Hosted Proxy

For future versions, we plan to add a self-hosted proxy option for users who prefer:
- No external dependencies
- Unlimited rate limits
- Complete control over the proxy
- Enhanced privacy

## Troubleshooting

### Common Issues

1. **Rate Limiting**: If you hit AllOrigins rate limits (100 requests/hour), wait a bit before trying again
2. **Network Issues**: Check your internet connection and try refreshing the page
3. **Feed Loading**: Some RSS feeds may be slow to respond or temporarily unavailable

### Monitoring

Check the browser console for RSS service logs:
- `RSS Service: Using AllOrigins proxy: [URL]`
- `RSS Service: XML fetched, parsing...`
- `RSS Service: Feed parsed successfully`

## Development

The RSS service is located in `src/services/rssService.ts` and handles:
- Fetching RSS feeds via AllOrigins
- Parsing XML content
- Caching responses
- Error handling
