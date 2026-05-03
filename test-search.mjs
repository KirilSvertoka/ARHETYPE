import http from 'http';

http.get('http://localhost:3000/api/products?search=Baccarat', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Search "Baccarat" returned count:', products.length);
    } catch(e) {}
  });
});

http.get('http://localhost:3000/api/products?search=xyznonexistentxyz', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Search "xyznonexistentxyz" returned count:', products.length);
    } catch(e) {}
  });
});
