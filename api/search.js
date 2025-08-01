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
    adult,
    child,
    currencyCode = 'USD',
  } = req.query;

  // Safely convert to numbers
  const adults = Number.isNaN(Number(adult)) ? 1 : Number(adult);
  const children = Number.isNaN(Number(child)) ? 0 : Number(child);

  // Validate required fields
  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required query parameters: origin, destination, date',
    });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults,
      children,
      max: 8,
      currencyCode,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Amadeus error:', error.response?.body || error.message || error);

    let errData = error.response?.body;
    try {
      errData = JSON.parse(errData);
    } catch {}

    res.status(500).json({ error: errData || 'Internal Server Error' });
  }
}
