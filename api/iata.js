export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.liteapi.travel/v3.0/data/iataCodes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.LITEAPI_KEY
      }
    });

    const data = await response.json();

    res.status(200).json(data.data); // return just the array
  } catch (err) {
    console.error('IATA fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch IATA codes' });
  }
}
