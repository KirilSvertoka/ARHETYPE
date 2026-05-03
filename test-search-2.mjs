import http from 'http';

http.get('http://localhost:3000/api/products?search=Maison', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Search "Maison" returned count:', products.length);
    } catch(e) {}
  });
});
