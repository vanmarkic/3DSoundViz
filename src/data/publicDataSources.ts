/**
 * Predefined public APIs and WebSocket data sources
 * These can be used as alternative inputs to audio for driving visualizations
 */

import type { PublicDataSourceTemplate } from '@core/types'

export const PUBLIC_DATA_SOURCES: PublicDataSourceTemplate[] = [
  // ============================================================================
  // Cryptocurrency
  // ============================================================================
  {
    name: 'Binance WebSocket - BTC/USDT',
    description: 'Real-time Bitcoin price updates from Binance',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Binance BTC/USDT',
      url: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
      dataPath: '$.p', // Price
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'Bitcoin price',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$.q',
        description: 'Quantity traded',
        suggestedParameter: 'complexity',
      },
    ],
  },
  {
    name: 'Binance WebSocket - ETH/USDT',
    description: 'Real-time Ethereum price from Binance',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Binance ETH/USDT',
      url: 'wss://stream.binance.com:9443/ws/ethusdt@trade',
      dataPath: '$.p',
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'Ethereum price',
        suggestedParameter: 'colorIntensity',
      },
      {
        dataPath: '$.q',
        description: 'Quantity traded',
        suggestedParameter: 'fragmentation',
      },
    ],
  },
  {
    name: 'Binance WebSocket - SOL/USDT',
    description: 'Real-time Solana price from Binance',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Binance SOL/USDT',
      url: 'wss://stream.binance.com:9443/ws/solusdt@trade',
      dataPath: '$.p',
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'Solana price',
        suggestedParameter: 'rotationSpeed',
      },
    ],
  },
  {
    name: 'Binance WebSocket - BNB/USDT',
    description: 'Real-time BNB price from Binance',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Binance BNB/USDT',
      url: 'wss://stream.binance.com:9443/ws/bnbusdt@trade',
      dataPath: '$.p',
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'BNB price',
        suggestedParameter: 'depth',
      },
    ],
  },
  {
    name: 'Binance Aggregated Trades - BTC',
    description: 'Bitcoin aggregated trade stream with volume',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Binance BTC Aggregated',
      url: 'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
      dataPath: '$.p',
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'Price',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$.q',
        description: 'Quantity',
        suggestedParameter: 'complexity',
      },
    ],
  },
  {
    name: 'Kraken WebSocket - BTC/USD',
    description: 'Real-time Bitcoin ticker from Kraken',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Kraken BTC/USD',
      url: 'wss://ws.kraken.com',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$',
        description: 'Market data',
        suggestedParameter: 'glitchAmount',
      },
    ],
  },
  {
    name: 'CoinGecko API - Bitcoin',
    description: 'Bitcoin market data (price, volume, market cap)',
    category: 'crypto',
    source: {
      type: 'api',
      name: 'CoinGecko Bitcoin',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true',
      method: 'GET',
      pollInterval: 30000, // 30 seconds
      dataPath: '$.bitcoin',
    },
    suggestedMappings: [
      {
        dataPath: '$.bitcoin.usd',
        description: 'BTC price in USD',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$.bitcoin.usd_24h_change',
        description: '24h price change %',
        suggestedParameter: 'asymmetry',
      },
      {
        dataPath: '$.bitcoin.usd_24h_vol',
        description: '24h trading volume',
        suggestedParameter: 'complexity',
      },
    ],
  },

  // ============================================================================
  // Weather
  // ============================================================================
  {
    name: 'OpenMeteo API - Weather',
    description: 'Real-time weather data (temperature, wind, precipitation)',
    category: 'weather',
    source: {
      type: 'api',
      name: 'OpenMeteo Weather',
      url: 'https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,wind_speed_10m,precipitation',
      method: 'GET',
      pollInterval: 300000, // 5 minutes
      dataPath: '$.current',
    },
    suggestedMappings: [
      {
        dataPath: '$.current.temperature_2m',
        description: 'Temperature in °C',
        suggestedParameter: 'colorIntensity',
      },
      {
        dataPath: '$.current.wind_speed_10m',
        description: 'Wind speed in km/h',
        suggestedParameter: 'rotationSpeed',
      },
      {
        dataPath: '$.current.precipitation',
        description: 'Precipitation in mm',
        suggestedParameter: 'liquidity',
      },
    ],
  },

  // ============================================================================
  // Random / Art
  // ============================================================================
  {
    name: 'Random.org API',
    description: 'True random numbers from atmospheric noise',
    category: 'random',
    source: {
      type: 'api',
      name: 'Random.org',
      url: 'https://www.random.org/integers/?num=10&min=0&max=100&col=1&base=10&format=plain',
      method: 'GET',
      pollInterval: 5000, // 5 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$[0]',
        description: 'Random value 1',
        suggestedParameter: 'fragmentation',
      },
      {
        dataPath: '$[1]',
        description: 'Random value 2',
        suggestedParameter: 'glitchAmount',
      },
    ],
  },

  // ============================================================================
  // Finance
  // ============================================================================
  {
    name: 'Alpha Vantage - Stock Quote',
    description: 'Real-time stock quotes (requires API key)',
    category: 'finance',
    source: {
      type: 'api',
      name: 'Alpha Vantage Stock',
      url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=demo',
      method: 'GET',
      pollInterval: 60000, // 1 minute
      dataPath: '$["Global Quote"]',
    },
    suggestedMappings: [
      {
        dataPath: '$["Global Quote"]["05. price"]',
        description: 'Stock price',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$["Global Quote"]["09. change"]',
        description: 'Price change',
        suggestedParameter: 'asymmetry',
      },
      {
        dataPath: '$["Global Quote"]["06. volume"]',
        description: 'Trading volume',
        suggestedParameter: 'complexity',
      },
    ],
  },

  // ============================================================================
  // Social / Network
  // ============================================================================
  {
    name: 'GitHub Events API',
    description: 'Public GitHub events stream',
    category: 'social',
    source: {
      type: 'api',
      name: 'GitHub Events',
      url: 'https://api.github.com/events',
      method: 'GET',
      pollInterval: 60000, // 1 minute
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Number of recent events',
        suggestedParameter: 'complexity',
      },
    ],
  },

  // ============================================================================
  // Science / Space
  // ============================================================================
  {
    name: 'ISS Location API',
    description: 'International Space Station current position',
    category: 'other',
    source: {
      type: 'api',
      name: 'ISS Location',
      url: 'http://api.open-notify.org/iss-now.json',
      method: 'GET',
      pollInterval: 5000, // 5 seconds
      dataPath: '$.iss_position',
    },
    suggestedMappings: [
      {
        dataPath: '$.iss_position.latitude',
        description: 'ISS Latitude',
        suggestedParameter: 'depth',
      },
      {
        dataPath: '$.iss_position.longitude',
        description: 'ISS Longitude',
        suggestedParameter: 'rotationSpeed',
      },
    ],
  },
  {
    name: 'NASA APOD API',
    description: 'Astronomy Picture of the Day metadata',
    category: 'other',
    source: {
      type: 'api',
      name: 'NASA APOD',
      url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
      method: 'GET',
      pollInterval: 86400000, // 24 hours
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.date',
        description: 'Date as trigger',
        suggestedParameter: 'colorIntensity',
      },
    ],
  },

  // ============================================================================
  // Time / Clock
  // ============================================================================
  {
    name: 'World Time API',
    description: 'Current time in different timezones',
    category: 'other',
    source: {
      type: 'api',
      name: 'World Time',
      url: 'http://worldtimeapi.org/api/timezone/Europe/Paris',
      method: 'GET',
      pollInterval: 1000, // 1 second
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.unixtime',
        description: 'Unix timestamp',
        suggestedParameter: 'rotationSpeed',
      },
      {
        dataPath: '$.day_of_year',
        description: 'Day of year',
        suggestedParameter: 'colorIntensity',
      },
    ],
  },

  // ============================================================================
  // Seismic / Earth
  // ============================================================================
  {
    name: 'USGS Earthquake API',
    description: 'Recent earthquakes worldwide',
    category: 'other',
    source: {
      type: 'api',
      name: 'USGS Earthquakes',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      method: 'GET',
      pollInterval: 300000, // 5 minutes
      dataPath: '$.features',
    },
    suggestedMappings: [
      {
        dataPath: '$.features[0].properties.mag',
        description: 'Earthquake magnitude',
        suggestedParameter: 'fragmentation',
      },
      {
        dataPath: '$.features.length',
        description: 'Number of earthquakes',
        suggestedParameter: 'complexity',
      },
    ],
  },

  // ============================================================================
  // Real-time Data Streams (WebSocket)
  // ============================================================================
  {
    name: 'Blockchain.com WebSocket - BTC Transactions',
    description: 'Live Bitcoin transaction stream',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Blockchain.com BTC TX',
      url: 'wss://ws.blockchain.info/inv',
      dataPath: '$.x',
    },
    suggestedMappings: [
      {
        dataPath: '$.x.out[0].value',
        description: 'Transaction value',
        suggestedParameter: 'glitchAmount',
      },
    ],
  },
  {
    name: 'Finnhub WebSocket - Stock Trades',
    description: 'Real-time stock market trades (requires free API key)',
    category: 'finance',
    source: {
      type: 'websocket',
      name: 'Finnhub Stocks',
      url: 'wss://ws.finnhub.io?token=demo',
      dataPath: '$.data',
    },
    suggestedMappings: [
      {
        dataPath: '$.data[0].p',
        description: 'Stock price',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$.data[0].v',
        description: 'Volume',
        suggestedParameter: 'complexity',
      },
    ],
  },
  {
    name: 'IEX Cloud WebSocket - Market Data',
    description: 'Real-time stock quotes (sandbox/demo)',
    category: 'finance',
    source: {
      type: 'websocket',
      name: 'IEX Cloud',
      url: 'wss://sandbox-sse.iexapis.com/stable/stocksUSNoUTP?token=Tpk_demo',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.price',
        description: 'Stock price',
        suggestedParameter: 'colorIntensity',
      },
    ],
  },
  {
    name: 'Polygon.io WebSocket - Forex',
    description: 'Real-time forex currency exchange rates',
    category: 'finance',
    source: {
      type: 'websocket',
      name: 'Polygon Forex',
      url: 'wss://socket.polygon.io/forex',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.p',
        description: 'Exchange rate',
        suggestedParameter: 'asymmetry',
      },
    ],
  },
  {
    name: 'Bitmex WebSocket - Bitcoin Perpetual',
    description: 'Bitcoin perpetual swap real-time data',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Bitmex BTC Perp',
      url: 'wss://www.bitmex.com/realtime',
      dataPath: '$.data',
    },
    suggestedMappings: [
      {
        dataPath: '$.data[0].price',
        description: 'Contract price',
        suggestedParameter: 'scale',
      },
    ],
  },
  {
    name: 'Deribit WebSocket - Options',
    description: 'Crypto options and futures real-time',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Deribit',
      url: 'wss://www.deribit.com/ws/api/v2',
      dataPath: '$.params.data',
    },
    suggestedMappings: [
      {
        dataPath: '$.params.data.last_price',
        description: 'Last price',
        suggestedParameter: 'rotationSpeed',
      },
    ],
  },
  {
    name: 'Messari WebSocket - Asset Metrics',
    description: 'Real-time cryptocurrency metrics',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Messari Metrics',
      url: 'wss://data.messari.io/v1/ws',
      dataPath: '$.payload',
    },
    suggestedMappings: [
      {
        dataPath: '$.payload.market_data.price_usd',
        description: 'Asset price USD',
        suggestedParameter: 'depth',
      },
    ],
  },
  {
    name: 'CryptoCompare WebSocket - Multi Crypto',
    description: 'Multiple cryptocurrency streams',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'CryptoCompare',
      url: 'wss://streamer.cryptocompare.com/v2',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.PRICE',
        description: 'Current price',
        suggestedParameter: 'motionBlur',
      },
    ],
  },
  {
    name: 'Twelvedata WebSocket - Stocks',
    description: 'Real-time stock market data',
    category: 'finance',
    source: {
      type: 'websocket',
      name: 'Twelvedata Stocks',
      url: 'wss://ws.twelvedata.com/v1/quotes/price',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.price',
        description: 'Stock price',
        suggestedParameter: 'contrast',
      },
    ],
  },
  {
    name: 'CoinCap WebSocket - All Assets',
    description: 'Real-time data for 1000+ crypto assets',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'CoinCap Assets',
      url: 'wss://ws.coincap.io/prices?assets=ALL',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.bitcoin',
        description: 'Bitcoin price',
        suggestedParameter: 'scale',
      },
      {
        dataPath: '$.ethereum',
        description: 'Ethereum price',
        suggestedParameter: 'colorIntensity',
      },
    ],
  },

  // ============================================================================
  // AI & Generative Content (Note: Most require API keys)
  // ============================================================================
  {
    name: 'Reddit r/all Stream',
    description: 'Live stream of Reddit posts and comments (includes bot activity)',
    category: 'social',
    source: {
      type: 'api',
      name: 'Reddit Stream',
      url: 'https://www.reddit.com/r/all/new.json?limit=10',
      method: 'GET',
      pollInterval: 10000, // 10 seconds
      dataPath: '$.data.children',
    },
    suggestedMappings: [
      {
        dataPath: '$.data.children.length',
        description: 'Number of new posts',
        suggestedParameter: 'complexity',
      },
      {
        dataPath: '$.data.children[0].data.score',
        description: 'Post score',
        suggestedParameter: 'glitchAmount',
      },
    ],
  },
  {
    name: 'Hacker News Live',
    description: 'Real-time Hacker News items (tech discussions)',
    category: 'social',
    source: {
      type: 'api',
      name: 'Hacker News',
      url: 'https://hacker-news.firebaseio.com/v0/newstories.json',
      method: 'GET',
      pollInterval: 30000, // 30 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Number of stories',
        suggestedParameter: 'complexity',
      },
    ],
  },
  {
    name: 'Wikipedia Recent Changes',
    description: 'Live stream of Wikipedia edits worldwide',
    category: 'social',
    source: {
      type: 'websocket',
      name: 'Wikipedia Changes',
      url: 'wss://stream.wikimedia.org/v2/stream/recentchange',
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Edit length',
        suggestedParameter: 'fragmentation',
      },
      {
        dataPath: '$.bot',
        description: 'Bot edit indicator',
        suggestedParameter: 'glitchAmount',
      },
    ],
  },
  {
    name: 'Mastodon Public Timeline',
    description: 'Federated social network public posts stream',
    category: 'social',
    source: {
      type: 'api',
      name: 'Mastodon Public',
      url: 'https://mastodon.social/api/v1/timelines/public?limit=20',
      method: 'GET',
      pollInterval: 15000, // 15 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Number of posts',
        suggestedParameter: 'rotationSpeed',
      },
      {
        dataPath: '$[0].favourites_count',
        description: 'Likes count',
        suggestedParameter: 'colorIntensity',
      },
    ],
  },
  {
    name: 'Random Word Generator',
    description: 'Continuous random word generation (simulates AI text)',
    category: 'random',
    source: {
      type: 'api',
      name: 'Random Words',
      url: 'https://random-word-api.herokuapp.com/word?number=10',
      method: 'GET',
      pollInterval: 5000, // 5 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Number of words',
        suggestedParameter: 'motionBlur',
      },
    ],
  },
  {
    name: 'Quotable - Random Quotes',
    description: 'Random inspirational quotes (like AI wisdom)',
    category: 'other',
    source: {
      type: 'api',
      name: 'Random Quotes',
      url: 'https://api.quotable.io/random',
      method: 'GET',
      pollInterval: 8000, // 8 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Quote length',
        suggestedParameter: 'depth',
      },
    ],
  },
  {
    name: 'JokeAPI - Programming Jokes',
    description: 'Random programming jokes (bot-like humor)',
    category: 'other',
    source: {
      type: 'api',
      name: 'Programming Jokes',
      url: 'https://v2.jokeapi.dev/joke/Programming?type=single',
      method: 'GET',
      pollInterval: 10000, // 10 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.joke',
        description: 'Joke text',
        suggestedParameter: 'asymmetry',
      },
    ],
  },
  {
    name: 'OpenLibrary Recent Changes',
    description: 'Book database edits and updates',
    category: 'other',
    source: {
      type: 'api',
      name: 'OpenLibrary Updates',
      url: 'https://openlibrary.org/recentchanges.json?limit=10',
      method: 'GET',
      pollInterval: 20000, // 20 seconds
      dataPath: '$',
    },
    suggestedMappings: [
      {
        dataPath: '$.length',
        description: 'Number of changes',
        suggestedParameter: 'liquidity',
      },
    ],
  },
  {
    name: 'Twitch Top Streams',
    description: 'Live streaming data (includes AI VTubers)',
    category: 'social',
    source: {
      type: 'api',
      name: 'Twitch Streams',
      url: 'https://api.twitch.tv/helix/streams',
      method: 'GET',
      headers: {
        'Client-ID': 'demo'
      },
      pollInterval: 60000, // 1 minute
      dataPath: '$.data',
    },
    suggestedMappings: [
      {
        dataPath: '$.data.length',
        description: 'Number of live streams',
        suggestedParameter: 'complexity',
      },
      {
        dataPath: '$.data[0].viewer_count',
        description: 'Viewer count',
        suggestedParameter: 'scale',
      },
    ],
  },
]

/**
 * Get data sources by category
 */
export function getDataSourcesByCategory(
  category: PublicDataSourceTemplate['category']
): PublicDataSourceTemplate[] {
  return PUBLIC_DATA_SOURCES.filter((source) => source.category === category)
}

/**
 * Get all categories
 */
export function getAllCategories(): Array<PublicDataSourceTemplate['category']> {
  return ['crypto', 'weather', 'social', 'finance', 'random', 'other']
}

/**
 * Search data sources by name or description
 */
export function searchDataSources(query: string): PublicDataSourceTemplate[] {
  const lowerQuery = query.toLowerCase()
  return PUBLIC_DATA_SOURCES.filter(
    (source) =>
      source.name.toLowerCase().includes(lowerQuery) ||
      source.description.toLowerCase().includes(lowerQuery)
  )
}
