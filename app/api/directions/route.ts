import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const waypoints = searchParams.get('waypoints');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  console.log('🚗 Directions API Request:', {
    origin,
    destination,
    waypoints: waypoints ? waypoints.split('|').length : 0,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    console.error('❌ Google Maps API key not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination are required' },
      { status: 400 }
    );
  }

  try {
    // Construir URL com waypoints e otimização
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    // Adicionar waypoints se existirem (máximo 25 waypoints)
    if (waypoints) {
      const waypointList = waypoints.split('|');
      
      // Google Maps API tem limite de 25 waypoints
      if (waypointList.length > 25) {
        console.warn(`⚠️ Número de waypoints (${waypointList.length}) excede o limite de 25. Usando apenas os primeiros 25.`);
        const limitedWaypoints = waypointList.slice(0, 25).join('|');
        url += `&waypoints=optimize:true|${encodeURIComponent(limitedWaypoints)}`;
      } else {
        // optimize:true faz o Google Maps otimizar a ordem dos waypoints
        url += `&waypoints=optimize:true|${encodeURIComponent(waypoints)}`;
      }
      
      console.log(`📍 Processando ${Math.min(waypointList.length, 25)} waypoints com otimização`);
    }
    
    url += `&key=${apiKey}`;
    
    console.log('🌐 Fetching route from Google Maps API...');
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ Route fetched successfully');
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        console.log(`📊 Route details:`, {
          legs: route.legs?.length || 0,
          distance: route.legs?.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) / 1000 + ' km',
          duration: route.legs?.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) / 60 + ' min',
          waypointOrder: route.waypoint_order
        });
      }
    } else {
      console.error('❌ Google Maps API error:', data.status, data.error_message);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching directions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}
