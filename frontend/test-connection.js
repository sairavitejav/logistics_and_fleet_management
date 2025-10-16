// Test backend connectivity
const API_URL = 'http://localhost:5001/api';

async function testConnection() {
  try {
    console.log('Testing connection to:', API_URL);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpass123',
        role: 'customer'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
