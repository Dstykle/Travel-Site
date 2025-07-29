document.addEventListener('DOMContentLoaded', () => {
              var elems = document.querySelectorAll('select');
            var instances = M.FormSelect.init(elems);
            
            // Initialize sidenav
            var sidenavElems = document.querySelectorAll('.sidenav');
            var sidenavInstances = M.Sidenav.init(sidenavElems, {
                edge: 'right'
            });
            
            // Set minimum date to today
            var today = new Date().toISOString().split('T')[0];
            document.getElementById('date').setAttribute('min', today);
    const adultSelect = document.getElementById('adult');
    const childSelect = document.getElementById('child');

    // Populate Adults (1-20)
    for (let i = 1; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        adultSelect.appendChild(option);
    }

    // Populate Children (0-20)
    for (let i = 0; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        childSelect.appendChild(option);
    }
});
document.getElementById('flightForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  
  const origin = document.getElementById('origin').value.toUpperCase();
  const destination = document.getElementById('destination').value.toUpperCase();
  const date = document.getElementById('date').value;
  const child = document.getElementById('child').value;
  const adult = document.getElementById('adult').value;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<p>Searching...</p>';
  if (child<= 0 && adult <= 0) {
    resultsDiv.innerHTML = '<p>Enter more than 1 passenger</p>';
  }
  else{
    document.getElementById('loading').classList.add('show');
  document.getElementById('results').innerHTML = '';
    try {
          //Local path
      const response = await fetch(`http://localhost:3000/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currencyCode=USD`);
      /*
      //Online path
      const response = await fetch(`/api/search?origin=${origin}&destination=${destination}&date=${date}&adults=${adult}&children=${child}&currencyCode=USD`);
      */
      if (!response.ok) throw new Error('Flight search failed');

      const data = await response.json();
      console.log(data)
      if (data.length === 0) {
        resultsDiv.innerHTML = '<p>No flights found.</p>';
        return;
      }
      
      document.getElementById('loading').classList.remove('show');

      document.getElementById('results').innerHTML = `
                    <div class="flight-card">
                        <h5 style="color: #657A42; margin-bottom: 15px;">
                            <i class="fas fa-plane" style="margin-right: 10px;"></i>
                            Flight Results
                        </h5>
                    </div>
                `;
      data.forEach(offer => {
        const itinerary = offer.itineraries[0];
        const firstSegment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];

        const flightCard = document.createElement('div');
        flightCard.className = 'flight-card';

        flightCard.innerHTML = `
              <p><strong>${firstSegment.departure.iataCode}</strong> → <strong>${lastSegment.arrival.iataCode}</strong></p>
              <p>Carrier: ${firstSegment.carrierCode}</p>
              <p>Duration: ${firstSegment.duration.slice(2)}</p>
              <p>Departure: ${firstSegment.departure.at.replace('T', ', ')}</p>
              <p>Arrival: ${lastSegment.arrival.at.replace('T', ', ')}</p>
              <p>Passengers: ${adult} Adult(s)${child > 0 ? `, ${child} Child(ren)` : ''}</p>
              <p>Price: ${offer.price.total} ${offer.price.currency} per passenger</p>
            `;

        resultsDiv.appendChild(flightCard);
      });

    } catch (err) {
      console.error(err);
      resultsDiv.innerHTML = '<p>Error retrieving flight data.</p>';
    }
  }
});
