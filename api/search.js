import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

// Create serverless function handler for flight search
export default async function handler(req, res) {
  const { origin, destination, date, currencyCode = 'USD' } = req.query;

  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'Missing required query parameters: origin, destination, date' });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: 1,
      max: 5,
      currencyCode,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Amadeus error:', error.response?.body || error.message || error);
    let errData = error.response?.body;
    try {
      errData = JSON.parse(errData);
    } catch { }
    res.status(500).json({ error: errData || 'Internal Server Error' });
  }
}


