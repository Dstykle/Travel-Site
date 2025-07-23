document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("flightForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    const departure = document.getElementById("departure").value;

    const flightData = {
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departure,
    };

    const res = await fetch("/api/flights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flightData),
    });

    const result = await res.json();
    console.log("Flight result:", result);

    document.getElementById("flight-results").innerHTML = `
      <h2>Flight Found:</h2>
      <p><strong>Airline:</strong> ${result.airline}</p>
      <p><strong>Flight Number:</strong> ${result.flight_number}</p>
      <p><strong>Departure:</strong> ${result.departure_airport} at ${result.departure_time}</p>
      <p><strong>Arrival:</strong> ${result.arrival_airport} at ${result.arrival_time}</p>
      <p><strong>Duration:</strong> ${result.duration_minutes} minutes</p>
      <p><strong>Price:</strong> $${result.price}</p>
      <img src="${result.logo}" alt="Airline Logo" />
    `;
  });
});