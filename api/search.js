// Import the Amadeus SDK for Node.js
import Amadeus from 'amadeus';

// Create an instance of the Amadeus client using environment variables
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

// Define the API route handler for flight offer search
export default async function handler(req, res) {
  //GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Destructure query parameters from the request
  const {
    origin,        // IATA code for origin airport
    destination,   // IATA code for destination airport 
    date,          // Departure date in YYYY-MM-DD format
    adult,         // Number of adult passengers
    child,         // Number of child passengers
    currencyCode = 'USD', // currency for prices, default to USD
  } = req.query;

  // Parse passenger counts and fallback to defaults if not provided
  const adultsCount = parseInt(adult, 10) || 3;
  const childrenCount = parseInt(child, 10) || 0;

  // Validate required parameters
  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required query parameters: origin, destination, date',
    });
  }

  try {
    // Call Amadeus API to search for flight offers with provided parameters
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adultsCount,
      children: childrenCount,
      max: 8,              // Limit the number of returned results to 8
      currencyCode,        // Currency for the returned prices
    });

    // Return the retrieved flight offer data in JSON format
    res.status(200).json(response.data);

  } catch (error) {
    // Log error details for debugging
    console.error('Amadeus error:', error.response?.body || error.message || error);

    // Try to parse the error body if it's a JSON string
    let errData = error.response?.body;
    try {
      errData = JSON.parse(errData);
    } catch {}

    // Return an error response to the client
    res.status(500).json({ error: errData || 'Internal Server Error' });
  }
}

