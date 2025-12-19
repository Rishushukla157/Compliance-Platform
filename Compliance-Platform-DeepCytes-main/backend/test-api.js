const fetch = require('node-fetch'); // You might need to install: npm install node-fetch
// Alternatively, you can test this in your browser console or use curl

async function testUserQuestionsAPI() {
  try {
    // You'll need to replace this with a valid access token from your application
    // You can get this by logging into your app and checking localStorage.getItem('accessToken')
    const accessToken = 'YOUR_ACCESS_TOKEN_HERE';
    
    const response = await fetch('http://localhost:3001/api/user/questions?userType=user&userId=test-user-123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

// testUserQuestionsAPI();
console.log('Replace YOUR_ACCESS_TOKEN_HERE with a real token and uncomment the function call');
