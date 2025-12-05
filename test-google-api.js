/**
 * Script de Teste da Google Maps Directions API
 * Execute com: node test-google-api.js
 */

const fs = require('fs');
const path = require('path');

// Ler API key do arquivo .env.local
let API_KEY = null;
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)/);
  if (match) {
    API_KEY = match[1].trim();
  }
} catch (error) {
  // Arquivo não encontrado
}

console.log('\n🧪 Testando Google Maps Directions API...\n');

if (!API_KEY) {
  console.error('❌ ERRO: API key não encontrada!');
  console.log('📝 Verifique se o arquivo .env.local existe e contém:');
  console.log('   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui\n');
  process.exit(1);
}

console.log('✅ API key encontrada:', API_KEY.substring(0, 10) + '...');
console.log('📍 Testando rota: São Paulo (Paulista) → São Paulo (Centro)\n');

// Coordenadas de teste
const origin = '-23.5613,-46.6565'; // Av. Paulista
const destination = '-23.5505,-46.6333'; // Centro de SP

const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_KEY}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log('📡 Resposta da API recebida!\n');
    
    if (data.status === 'OK') {
      console.log('✅ SUCESSO! A API está funcionando corretamente!\n');
      console.log('📊 Detalhes da rota:');
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      console.log(`   📏 Distância: ${leg.distance.text}`);
      console.log(`   ⏱️  Duração: ${leg.duration.text}`);
      console.log(`   🚗 Início: ${leg.start_address}`);
      console.log(`   🏁 Fim: ${leg.end_address}`);
      console.log(`   📍 Pontos na rota: ${route.overview_polyline.points.length} caracteres\n`);
      
      console.log('🎉 Configuração completa! Você pode usar a API no seu app.\n');
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('❌ ERRO: REQUEST_DENIED\n');
      console.log('🔧 Possíveis causas:');
      console.log('   1. API key inválida');
      console.log('   2. Directions API não está ativada no Google Cloud');
      console.log('   3. Restrições da API key muito restritivas\n');
      console.log('📝 Solução:');
      console.log('   1. Acesse: https://console.cloud.google.com/apis/library');
      console.log('   2. Procure por "Directions API"');
      console.log('   3. Clique em "ENABLE"\n');
      console.log('💡 Mensagem da API:', data.error_message || 'Nenhuma mensagem adicional\n');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ ERRO: OVER_QUERY_LIMIT\n');
      console.log('📝 Você excedeu o limite de requisições.');
      console.log('   Verifique seu billing no Google Cloud Console.\n');
    } else {
      console.error(`❌ ERRO: ${data.status}\n`);
      console.log('💡 Mensagem:', data.error_message || 'Nenhuma mensagem adicional\n');
    }
  })
  .catch(error => {
    console.error('❌ ERRO ao fazer requisição:\n');
    console.error(error);
    console.log('\n📝 Verifique sua conexão com a internet.\n');
  });
