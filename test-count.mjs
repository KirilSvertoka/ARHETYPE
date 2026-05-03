import http from 'http';

http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Total returned without query params:', products.length);
    } catch(e) {}
  });
});
