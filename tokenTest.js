const fetch = require('node-fetch');

async function getAccessToken() {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'gFDW6b5v702huiCu58g2GSoWt80J7AgV',
      client_secret: '7sZIWe3JDQrkr5Oq'
    })
  });

  const data = await res.json();
  console.log('Access Token:', data.access_token);
  return data.access_token;
}

getAccessToken();

