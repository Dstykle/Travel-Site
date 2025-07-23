const express = require("express");
const axios = require("axios");
const cors = require("cors");

require('dotenv').config();

console.log("Using SERPAPI key:", process.env.SERPAPI_KEY);



const app = express();
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const PORT = 3000;

app.post('/flights', async (req, res) => {
  const { departure_id, arrival_id, outbound_date } = req.body;

  const params = {
    engine: 'google_flights',
    departure_id,
    arrival_id,
    outbound_date,
    currency: 'USD',
    hl: 'en',
    type: '2',
    api_key: process.env.SERPAPI_KEY
  };

  try {
    console.log('Sending SerpAPI request with:', params);
    const response = await axios.get('https://serpapi.com/search.json', { params });
    const data = response.data;

    if (!data.best_flights || data.best_flights.length === 0) {
      return res.status(404).json({ message: 'No flights found.' });
    }

    // Extract basic info from the first result
    const flight = data.best_flights[0];
    const segment = flight.flights[0];

    const result = {
      airline: segment.airline,
      flight_number: segment.flight_number,
      departure_airport: segment.departure_airport.name,
      arrival_airport: segment.arrival_airport.name,
      departure_time: segment.departure_airport.time,
      arrival_time: segment.arrival_airport.time,
      duration_minutes: segment.duration,
      airplane: segment.airplane,
      price: flight.price,
      logo: segment.airline_logo,
      travel_class: segment.travel_class,
      extensions: segment.extensions,
      booking_token: flight.booking_token
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching flights:', error.message);
    res.status(500).json({ error: 'Failed to fetch flight data.' });
  }
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});