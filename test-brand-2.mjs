import http from 'http';

http.get('http://localhost:3000/api/products?brand=Maison%20Francis%20Kurkdjian', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Search "brand=Maison%20Francis%20Kurkdjian" returned count:', products.length);
    } catch(e) {}
  });
});
