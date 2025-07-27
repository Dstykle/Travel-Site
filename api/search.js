import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    origin,
    destination,
    date,
    adult = 1,
    child = 0,
    currencyCode = 'USD',
  } = req.query;

  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required query parameters: origin, destination, date',
    });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adult || 1,
      children: child || 0,
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
