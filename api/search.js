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
    currencyCode = 'USD',
  } = req.query;

  // Debug log
  console.log('Query:', req.query);

  const adultCountRaw = parseInt(adults, 10);
  const childCountRaw = parseInt(children, 10);

  const adultCount = Number.isInteger(adultCountRaw) && adultCountRaw > 0 ? adultCountRaw : 1;
  const childCount = Number.isInteger(childCountRaw) && childCountRaw >= 0 ? childCountRaw : 0;

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
      adults: adultCount,
      children: childCount,
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
