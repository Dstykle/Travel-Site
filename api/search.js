let cachedToken = null;
let tokenExpiry = null;

// Function to get access token from Amadeus
async function getAmadeusToken() {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    console.log('Using cached token');
    return cachedToken;
  }

  console.log('Fetching new Amadeus token...');
  
  try {
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID,
        client_secret: process.env.AMADEUS_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token fetch failed:', response.status, errorText);
      throw new Error(`Token fetch failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    
    // Cache the token with expiry (subtract 60 seconds for safety)
    cachedToken = tokenData.access_token;
    tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);
    
    console.log('New token obtained, expires at:', tokenExpiry);
    return cachedToken;
    
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    throw error;
  }
}

// Function to make authenticated API calls to Amadeus
async function makeAmadeusRequest(endpoint, params = {}) {
  const token = await getAmadeusToken();
  
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = `https://test.api.amadeus.com${endpoint}${queryString ? '?' + queryString : ''}`;
  
  console.log('Making Amadeus request to:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Amadeus API error:', response.status, errorData);
    
    // Try to parse error as JSON
    let parsedError;
    try {
      parsedError = JSON.parse(errorData);
    } catch (e) {
      parsedError = { error: errorData };
    }
    
    throw new Error(`Amadeus API error: ${response.status} - ${JSON.stringify(parsedError)}`);
  }

  return await response.json();
}

// Main API handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug environment variables
  console.log('Environment check:', {
    hasClientId: !!process.env.AMADEUS_CLIENT_ID,
    hasClientSecret: !!process.env.AMADEUS_CLIENT_SECRET,
    clientIdLength: process.env.AMADEUS_CLIENT_ID?.length || 0,
    timestamp: new Date().toISOString()
  });

  // Check if credentials are available
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Amadeus credentials not configured',
      details: 'Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET environment variables'
    });
  }

  const {
    origin,
    destination,
    date,
    adults,
    children,
    currency
  } = req.query;

  console.log('Received search parameters:', {
    origin,
    destination, 
    date,
    adults,
    children,
    currency,
    fullQuery: req.query
  });

  // Validate required parameters
  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required parameters: origin, destination, date',
      received: { origin, destination, date }
    });
  }

  // Parse and validate passenger counts
  const adultCount = parseInt(adults, 10);
  const childCount = parseInt(children, 10);

  if (isNaN(adultCount) || adultCount < 1) {
    return res.status(400).json({
      error: 'Invalid adult count. Must be at least 1.',
      received: adults
    });
  }

  if (isNaN(childCount) || childCount < 0) {
    return res.status(400).json({
      error: 'Invalid child count. Must be 0 or greater.',
      received: children
    });
  }

  // Validate date format and ensure it's not in the past
  const departureDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(departureDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format. Use YYYY-MM-DD.',
      received: date
    });
  }
  
  if (departureDate < today) {
    return res.status(400).json({
      error: 'Departure date cannot be in the past.',
      received: date
    });
  }

  try {
    // Build search parameters for Amadeus API
    const searchParams = {
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: adultCount.toString(),
      max: '8',
      currencyCode: currency || 'USD'
    };

    // Only add children parameter if count > 0
    if (childCount > 0) {
      searchParams.children = childCount.toString();
    }

    console.log('Searching flights with params:', searchParams);

    // Make the flight search request with Bearer token
    const flightData = await makeAmadeusRequest('/v2/shopping/flight-offers', searchParams);
    
    console.log('Flight search successful:', {
      resultCount: flightData.data?.length || 0,
      hasData: !!flightData.data,
      hasMeta: !!flightData.meta
    });

    // Return the flight data
    const results = flightData.data || [];
    res.status(200).json(results);

  } catch (error) {
    console.error('Flight search error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Parse error message to extract details
    let statusCode = 500;
    let errorMessage = 'Flight search failed';
    let errorDetails = error.message;
    
    // Handle different types of errors
    if (error.message.includes('Token fetch failed')) {
      statusCode = 401;
      errorMessage = 'Authentication failed - check your Amadeus credentials';
    } else if (error.message.includes('400')) {
      statusCode = 400;
      errorMessage = 'Invalid search parameters';
    } else if (error.message.includes('401')) {
      statusCode = 401;
      errorMessage = 'Authentication failed';
    } else if (error.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'No flights found for this route';
    } else if (error.message.includes('429')) {
      statusCode = 429;
      errorMessage = 'API rate limit exceeded';
    }

    // Try to extract JSON error details if available
    try {
      const errorMatch = error.message.match(/Amadeus API error: \d+ - (.+)/);
      if (errorMatch) {
        const parsedDetails = JSON.parse(errorMatch[1]);
        errorDetails = parsedDetails;
      }
    } catch (parseError) {
      // Keep original error message if parsing fails
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      statusCode: statusCode,
      timestamp: new Date().toISOString()
    });
  }
}