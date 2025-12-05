console.log("✅ Usando Google Maps Directions API");
    // Usar API Route do Next.js para evitar problemas de CORS
    const url = `/api/directions?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}`;
    
    const response = await fetch(url);
    const data = await response.json();
=======
  try {
    console.log("✅ Usando Google Maps Directions API");
    // Usar Netlify Function para evitar problemas de CORS
    const url = `/.netlify/functions/directions?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}`;

    const response = await fetch(url);
    const data = await response.json();
