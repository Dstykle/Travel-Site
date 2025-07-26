
document.getElementById('flightForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const origin = document.getElementById('origin').value.toUpperCase();
    const destination = document.getElementById('destination').value.toUpperCase();
    const date = document.getElementById('date').value;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Searching...</p>';

    try {
        // https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${origin}&destination=${destination}&date=${date}&currencyCode=USD
        const response = await fetch(`/api/search?origin=${origin}&destination=${destination}&date=${date}&currencyCode=USD`);
        console.log("/api/search?origin=" + origin + "&destination=" + destination + "&date=" + date + "&currencyCode=USD")

        if (!response.ok) throw new Error('Flight search failed');

        const data = await response.json();
        console.log(data)
        if (data.length === 0) {
            resultsDiv.innerHTML = '<p>No flights found.</p>';
            return;
        }

        resultsDiv.innerHTML = '<h2>Results:</h2>';

        data.forEach(offer => {
            const itinerary = offer.itineraries[0];
            const firstSegment = itinerary.segments[0];
            const lastSegment = itinerary.segments[itinerary.segments.length - 1];

            const flightCard = document.createElement('div');
            flightCard.className = 'flight-card';
            
            flightCard.innerHTML = `
            <p><strong>${firstSegment.departure.iataCode}</strong> → <strong>${lastSegment.arrival.iataCode}</strong></p>
            <p>Departure: ${firstSegment.departure.at}</p>
            <p>Arrival: ${lastSegment.arrival.at}</p>
            <p>Carrier: ${firstSegment.carrierCode}</p>
            <p>Duration: ${firstSegment.duration.slice[2,-1]}</p>
            <p>Price: ${offer.price.total} ${offer.price.currency}</p>
            
          `;

            resultsDiv.appendChild(flightCard);
        });

    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = '<p>Error retrieving flight data.</p>';
    }
});