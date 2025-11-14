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
    name: 'Coinbase WebSocket - ETH/USD',
    description: 'Real-time Ethereum price from Coinbase',
    category: 'crypto',
    source: {
      type: 'websocket',
      name: 'Coinbase ETH/USD',
      url: 'wss://ws-feed.exchange.coinbase.com',
      dataPath: '$.price',
    },
    suggestedMappings: [
      {
        dataPath: '$.price',
        description: 'Ethereum price',
        suggestedParameter: 'colorIntensity',
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
