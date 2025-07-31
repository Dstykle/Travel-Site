// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all Materialize <select> elements
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
    
    // Initialize Materialize sidenav component on the right edge
    var sidenavElems = document.querySelectorAll('.sidenav');
    var sidenavInstances = M.Sidenav.init(sidenavElems, {
        edge: 'right'
    });

    // Set today's date as the minimum selectable date for the departure input
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);

    // Get select elements for adult and child counts
    const adultSelect = document.getElementById('adult');
    const childSelect = document.getElementById('child');

    // Populate Adult dropdown (1 to 20 passengers)
    for (let i = 1; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        adultSelect.appendChild(option);
    }

    // Populate Children dropdown (0 to 20 passengers)
    for (let i = 0; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        childSelect.appendChild(option);
    }
});
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);

  const options = {
    month: 'short',  // e.g., Aug
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  return date.toLocaleString('en-US', options); // Customize locale as needed
}

// Handle form submission for flight search
document.getElementById('flightForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form behavior (page reload)

    // Get form input values and format them appropriately
    const origin = document.getElementById('origin').value.toUpperCase();
    const destination = document.getElementById('destination').value.toUpperCase();
    const date = document.getElementById('date').value;
    const child = document.getElementById('child').value;
    const adult = document.getElementById('adult').value;
    const resultsDiv = document.getElementById('results');

    // Show a "Searching..." placeholder
    resultsDiv.innerHTML = '<p>Searching...</p>';

    // Validate at least one passenger is selected
    if (child <= 0 && adult <= 0) {
        resultsDiv.innerHTML = '<p>Enter more than 1 passenger</p>';
    } else {
        // Show loading spinner or message
        document.getElementById('loading').classList.add('show');
        document.getElementById('results').innerHTML = '';

        try {
            // Make the local or web API call to the serverless backend
            //const response = await fetch(`http://localhost:3000/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currency=USD);`);
            const response = await fetch(`/api/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currency=USD`);
            if (!response.ok) throw new Error('Flight search failed');
          //console.log(`http://localhost:3000/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currency=USD);`)
            const data = await response.json();
            console.log(data); // For debugging purposes

            // Handle no results case
            if (data.length === 0) {
                resultsDiv.innerHTML = '<p>No flights found.</p>';
                return;
            }
            
            // Hide loading animation
            document.getElementById('loading').classList.remove('show');

            // Start results section with header
            document.getElementById('results').innerHTML = `
                <div class="flight-card">
                    <h5 style="color: #657A42; margin-bottom: 15px;">
                        <i class="fas fa-plane" style="margin-right: 10px;"></i>
                        Flight Results
                    </h5>
                </div>
            `;

            // Loop through each flight offer and display it
            data.forEach(offer => {
  const itinerary = offer.itineraries[0]; // Assuming first itinerary
  const segments = itinerary.segments;

  const flightCard = document.createElement('div');
  flightCard.className = 'flight-card';

  // Build each flight leg
  let segmentDetails = '';
  segments.forEach((segment, index) => {
    const depTime = formatDateTime(segment.departure.at);
const arrTime = formatDateTime(segment.arrival.at);


    segmentDetails += `
      <div style="margin-bottom: 10px;">
        <p><strong>Flight ${index + 1}:</strong></p>
        <p>${segment.departure.iataCode} → ${segment.arrival.iataCode}</p>
        <p>Carrier: ${segment.carrierCode} ${segment.number}</p>
        <p>Aircraft: ${segment.aircraft.code}</p>
        <p>Departure: ${depTime}</p>
        <p>Arrival: ${arrTime}</p>
        <p>Duration: ${segment.duration.slice(2)}</p>
      </div>
      <hr/>
    `;
  });

  // Build the full flight info card
  flightCard.innerHTML = `
    <p><strong>Total Route:</strong> ${segments[0].departure.iataCode} → ${segments[segments.length - 1].arrival.iataCode}</p>
    ${segmentDetails}
    <p><strong>Passengers:</strong> ${adult} Adult(s)${child > 0 ? `, ${child} Child(ren)` : ''}</p>
    <p><strong>Total Price:</strong> ${offer.price.total} ${offer.price.currency} per passenger</p>
  `;

  resultsDiv.appendChild(flightCard); // Add the card to the DOM
});


        } catch (err) {
            console.error(err);
            resultsDiv.innerHTML = '<p>Error retrieving flight data.</p>';
        }
    }
});
