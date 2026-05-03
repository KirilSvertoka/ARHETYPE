import http from 'http';

http.get('http://localhost:3000/api/products?brand=Kilian', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const products = JSON.parse(data);
    console.log(`Found ${products.length} products`);
    console.log(products.map(p => `${p.brand} - ${p.name}`));
  });
});
