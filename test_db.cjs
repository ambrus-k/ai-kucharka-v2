const fetch = require('node-fetch');

setTimeout(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/recipes');
        const data = await res.json();
        console.log(data.length);
    } catch(e) { console.error(e) }
}, 2000);
