// Import the Amadeus SDK for Node.js
import Amadeus from 'amadeus';

// Create an instance of the Amadeus client using environment variables
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    origin,
    destination,
    date,
    adults,
    children,
    currency, // Changed from currencyCode to match frontend
  } = req.query;

  // Debug log - this will help us see what's actually received
  console.log('Received query parameters:', {
    origin,
    destination,
    date,
    adults,
    children,
    currency,
    fullQuery: req.query
  });

  const adultCountRaw = parseInt(adults, 10);
  const childCountRaw = parseInt(children, 10);

  const adultCount = Number.isInteger(adultCountRaw) && adultCountRaw > 0 ? adultCountRaw : 1;
  const childCount = Number.isInteger(childCountRaw) && childCountRaw >= 0 ? childCountRaw : 0;

  console.log('Parsed passenger counts:', { adultCount, childCount });

  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required query parameters: origin, destination, date',
      received: { origin, destination, date }
    });
  }

  try {
    console.log('Making Amadeus API call with:', {
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: adultCount,
      children: childCount,
      max: 8,
      currencyCode: currency || 'USD',
    });

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: adultCount,
      children: childCount,
      max: 8,
      currencyCode: currency || 'USD', // Use currency from query, default to USD
    });

    console.log('Amadeus API response received, data length:', response.data?.length);
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Amadeus API error details:');
    console.error('Error message:', error.message);
    console.error('Error response status:', error.response?.status);
    console.error('Error response body:', error.response?.body);
    console.error('Full error object:', error);

    let errData = error.response?.body;
    let statusCode = error.response?.status || 500;
    
    try {
      if (typeof errData === 'string') {
        errData = JSON.parse(errData);
      }
    } catch (parseError) {
      console.error('Could not parse error response body:', parseError);
    }

    // Return more detailed error information
    res.status(statusCode).json({ 
      error: 'Amadeus API error',
      details: errData || error.message,
      statusCode: statusCode,
      timestamp: new Date().toISOString()
    });
  }
}