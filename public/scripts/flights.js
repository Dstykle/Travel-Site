document.addEventListener('DOMContentLoaded', () => {
    // Initialize Materialize select dropdowns
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);

    // Initialize Materialize sidenav on right edge
    const sidenavElems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenavElems, { edge: 'right' });

    // Set today's date as min date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);

    // Populate select options
    const adultSelect = document.getElementById('adult');
    const childSelect = document.getElementById('child');

    // Initialize form selects again after modifying DOM
    M.FormSelect.init(adultSelect);
    M.FormSelect.init(childSelect);

    //Fetch IATA codes on load
    fetchIataCodes();
});

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const options = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-US', options);
}

let iataCodes = [];
/******API to fetch and use IATA codes for validation******/
async function fetchIataCodes() {
  try {
    const response = await fetch('/api/iata');
    const data = await response.json();
    iataCodes = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch IATA codes:', error);
  }
}
/***Validation code *****/
function isValidIataCode(code) {
    const formatted = code.trim().toUpperCase();
    return iataCodes.some(entry => entry.code === formatted);
}
/***Function when form is submitted *****/
document.getElementById('flightForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const origin = document.getElementById('origin').value.toUpperCase();
    const destination = document.getElementById('destination').value.toUpperCase();
    const date = document.getElementById('date').value;
    const child = parseInt(document.getElementById('child').value);
    const adult = parseInt(document.getElementById('adult').value);
    const resultsDiv = document.getElementById('results');
    const errorMsg = document.getElementById('error-msg');

    // Wait for IATA codes to load if they aren't yet
    if (iataCodes.length === 0) {
        resultsDiv.innerHTML = '<p>Please wait, loading airport codes...</p>';
        console.log('First IATA code:', iataCodes[0]);
        return;
    }
    if(origin === destination){
      resultsDiv.innerHTML = '<p style="color:white">Cannot Travel From and To the same place.</p>';
      return;
    }
    const validOrigin = isValidIataCode(origin);
    const validDestination = isValidIataCode(destination);

    if (!validOrigin || !validDestination) {
      document.getElementById('loading').classList.remove('show');
        resultsDiv.innerHTML =
            `<p style="color:white"><i class="material-icons" style="color:white">
close
</i>Invalid ${!validOrigin ? 'origin' : ''}${!validOrigin && !validDestination ? ' and ' : ''}${!validDestination ? 'destination' : ''} IATA code.<p>`;
        return;
    }

    errorMsg.textContent = ''; // Clear any previous errors

    document.getElementById('loading').classList.add('show');
    resultsDiv.innerHTML = '';
/***Flight search fetching ****/
    try {
        const response = await fetch(`/api/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currency=USD`);
        if (!response.ok) throw new Error('Flight search failed');

        const data = await response.json();
        if (data.length === 0) {
            document.getElementById('loading').classList.remove('show');
            resultsDiv.innerHTML = '<p>No flights found.</p>';
            return;
        }

        document.getElementById('loading').classList.remove('show');

        resultsDiv.innerHTML = `
            <div class="flight-card">
                <h5 style="color: #657A42; margin-bottom: 15px;">
                    <i class="fas fa-plane" style="margin-right: 10px;"></i>
                    Flight Results
                </h5>
            </div>
        `;

        data.forEach(offer => {
            const itinerary = offer.itineraries[0];
            const segments = itinerary.segments;

            const flightCard = document.createElement('div');
            flightCard.className = 'flight-card';

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

            flightCard.innerHTML = `
                <p><strong>Total Route:</strong> ${segments[0].departure.iataCode} → ${segments[segments.length - 1].arrival.iataCode}</p>
                ${segmentDetails}
                <p><strong>Passengers:</strong> ${adult} Adult(s)${child > 0 ? `, ${child} Child(ren)` : ''}</p>
                <p><strong>Total Price:</strong> ${offer.price.total} ${offer.price.currency} per passenger</p>
            `;

            resultsDiv.appendChild(flightCard);
        });

    } catch (err) {
        console.error(err);
        document.getElementById('loading').classList.remove('show');
        resultsDiv.innerHTML = '<p>Error retrieving flight data.</p>';
    }
});
