# 📍 Endereços de Teste para Rotas

Use estes endereços para testar a funcionalidade de otimização de rotas.

## 🏙️ São Paulo - Centro/Paulista

### Teste Rápido (5 endereços próximos)

```
1. CEP: 01310-100
   Av. Paulista, 1000
   Bela Vista, São Paulo - SP

2. CEP: 01310-200
   Av. Paulista, 1200
   Bela Vista, São Paulo - SP

3. CEP: 01311-000
   Av. Paulista, 1500
   Bela Vista, São Paulo - SP

4. CEP: 01311-100
   Av. Paulista, 1700
   Bela Vista, São Paulo - SP

5. CEP: 01311-200
   Av. Paulista, 1900
   Bela Vista, São Paulo - SP
```

### Teste Médio (10 endereços - Zona Sul)

```
1. CEP: 04543-907 - Shopping Morumbi
2. CEP: 05508-000 - USP (Cidade Universitária)
3. CEP: 04711-130 - Av. Santo Amaro
4. CEP: 04661-100 - Brooklin
5. CEP: 04094-050 - Vila Mariana
6. CEP: 04038-031 - Paraíso
7. CEP: 04551-060 - Vila Olímpia
8. CEP: 04571-010 - Itaim Bibi
9. CEP: 05424-000 - Pinheiros
10. CEP: 05435-000 - Alto de Pinheiros
```

## 🏖️ Rio de Janeiro

### Teste Zona Sul (8 endereços)

```
1. CEP: 22010-000 - Centro
2. CEP: 22021-000 - Lapa
3. CEP: 22250-040 - Botafogo
4. CEP: 22290-140 - Flamengo
5. CEP: 22410-000 - Copacabana
6. CEP: 22420-040 - Copacabana
7. CEP: 22430-060 - Ipanema
8. CEP: 22440-030 - Leblon
```

## 🏢 Belo Horizonte

### Teste Centro/Savassi (6 endereços)

```
1. CEP: 30130-000 - Centro
2. CEP: 30140-000 - Funcionários
3. CEP: 30130-100 - Savassi
4. CEP: 30140-071 - Lourdes
5. CEP: 30150-000 - Santo Agostinho
6. CEP: 30160-041 - Cruzeiro
```

## 🌆 Brasília

### Teste Plano Piloto (5 endereços)

```
1. CEP: 70040-020 - Asa Sul (SBS)
2. CEP: 70070-600 - Asa Sul (Comercial Sul)
3. CEP: 70297-400 - Asa Sul (W3 Sul)
4. CEP: 70710-000 - Asa Norte (Comercial Norte)
5. CEP: 70040-902 - Asa Norte (SBN)
```

## 🏭 Curitiba

### Teste Centro/Batel (7 endereços)

```
1. CEP: 80010-000 - Centro
2. CEP: 80020-000 - Centro
3. CEP: 80250-000 - Batel
4. CEP: 80240-000 - Batel
5. CEP: 80230-000 - Água Verde
6. CEP: 80420-000 - Bigorrilho
7. CEP: 80430-000 - Mercês
```

## 🎯 Como Usar para Teste

### Método 1: Entrada Manual

1. Vá em "Adicionar CEP Manualmente"
2. Digite cada CEP
3. Preencha o número (pode usar números sequenciais: 100, 200, 300...)
4. Salve cada endereço

### Método 2: OCR (Simulado)

1. Crie etiquetas de teste com os CEPs
2. Use "Ler Etiqueta (OCR)"
3. Tire foto das etiquetas
4. Sistema detectará automaticamente

### Método 3: Dados Fictícios

```javascript
// Cole no console do navegador para adicionar rapidamente:
const testAddresses = [
  {
    cep: "01310-100",
    rua: "Av. Paulista",
    numero: "1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    destinatario: "João Silva",
    numeroPedido: "PED001",
  },
  {
    cep: "01310-200",
    rua: "Av. Paulista",
    numero: "1200",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    destinatario: "Maria Santos",
    numeroPedido: "PED002",
  },
  {
    cep: "01311-000",
    rua: "Av. Paulista",
    numero: "1500",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    destinatario: "Pedro Costa",
    numeroPedido: "PED003",
  },
];

testAddresses.forEach((addr, i) => {
  const address = {
    id: Date.now().toString() + i,
    ...addr,
    dataHora: new Date().toISOString(),
  };
  const stored = JSON.parse(
    localStorage.getItem("formirotas-addresses") || "[]"
  );
  stored.push(address);
  localStorage.setItem("formirotas-addresses", JSON.stringify(stored));
});

location.reload();
```

## 📊 Resultados Esperados

### Teste Rápido (5 endereços - Paulista)

- **Distância**: ~2-3 km
- **Tempo**: ~20-25 minutos
- **Ordem**: Sequencial ao longo da Av. Paulista

### Teste Médio (10 endereços - Zona Sul SP)

- **Distância**: ~25-35 km
- **Tempo**: ~1h 30min - 2h
- **Ordem**: Otimizada por proximidade

### Teste Rio (8 endereços - Zona Sul)

- **Distância**: ~15-20 km
- **Tempo**: ~1h - 1h 30min
- **Ordem**: Centro → Botafogo → Copacabana → Ipanema → Leblon

## ⚠️ Dicas para Teste

1. **Comece Pequeno**: Teste com 3-5 endereços primeiro
2. **Mesma Região**: Use endereços próximos para ver otimização clara
3. **Aguarde Geocodificação**: Cada endereço leva ~1 segundo
4. **Verifique no Mapa**: Confirme se a rota faz sentido
5. **Teste Google Maps**: Abra a rota no Google Maps para validar

## 🎓 Cenários de Teste

### Cenário 1: Entregas Sequenciais

- Use endereços na mesma avenida
- Espera-se ordem sequencial
- Teste: Av. Paulista 1000, 1200, 1500, 1700

### Cenário 2: Entregas Dispersas

- Use endereços em bairros diferentes
- Espera-se agrupamento por região
- Teste: Centro, Zona Sul, Zona Oeste

### Cenário 3: Muitas Entregas

- Use 15-20 endereços
- Teste performance do algoritmo
- Verifique tempo de processamento

### Cenário 4: Endereços Inválidos

- Use CEPs inexistentes
- Sistema deve ignorar e continuar
- Teste: 00000-000, 99999-999

## 📱 Teste Mobile

1. Abra no celular: http://localhost:3000 (ou IP da rede)
2. Adicione endereços
3. Crie rota
4. Abra no Google Maps
5. Use navegação GPS real

## ✅ Checklist de Teste

- [ ] Adicionar 5 endereços manualmente
- [ ] Criar rota otimizada
- [ ] Verificar mapa carrega corretamente
- [ ] Verificar marcadores numerados
- [ ] Verificar linha de rota
- [ ] Clicar em marcadores (popups)
- [ ] Abrir no Google Maps
- [ ] Verificar distância total
- [ ] Verificar tempo estimado
- [ ] Testar "Nova Rota"
- [ ] Testar com 0 endereços
- [ ] Testar com 1 endereço
- [ ] Testar com 20+ endereços

## 🐛 Problemas Comuns

### "Nenhum endereço pôde ser geocodificado"

- Verifique conexão com internet
- Use CEPs válidos
- Tente novamente após alguns segundos

### Mapa não carrega

- Limpe cache do navegador
- Verifique console para erros
- Recarregue a página

### Rota estranha

- Geocodificação pode ter imprecisão
- Verifique se CEPs estão corretos
- Alguns CEPs podem ter localização aproximada

---

**Bons testes! 🚀**
