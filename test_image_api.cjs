const fetch = require("node-fetch");
async function run() {
  const dummyBase64 = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const res = await fetch('http://localhost:3000/api/enhance-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: "What is this image?",
      fileData: dummyBase64,
      mimeType: "image/jpeg"
    })
  });
  const data = await res.json();
  console.log(data);
}
run();
