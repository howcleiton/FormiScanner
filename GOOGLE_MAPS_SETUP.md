# 🗺️ Como Configurar Google Maps API (Opcional)

## 📊 Por Que Usar Google Maps?

### **Comparação: OSRM vs Google Maps**

| Característica       | OSRM (Atual)               | Google Maps        |
| -------------------- | -------------------------- | ------------------ |
| **Custo**            | 100% Gratuito              | $200 grátis/mês    |
| **Precisão**         | Boa                        | Excelente          |
| **Cobertura Brasil** | Regular                    | Completa           |
| **Dados**            | Podem estar desatualizados | Sempre atualizados |
| **Trânsito**         | Não                        | Sim (opcional)     |
| **API Key**          | Não precisa                | Necessária         |

### **Custos do Google Maps**

- **$200 de crédito GRÁTIS por mês**
- Directions API: $5 por 1.000 requisições
- **Com $200 grátis = 40.000 rotas grátis/mês**
- Para uso pessoal/pequeno: **praticamente gratuito**

## 🎯 Sistema Híbrido Implementado

O sistema agora funciona assim:

```
┌─────────────────────────────────────┐
│  Tem Google Maps API Key?           │
├─────────────────────────────────────┤
│  SIM → Usa Google Maps (preciso)    │
│  NÃO → Usa OSRM (gratuito)          │
└─────────────────────────────────────┘
```

**Vantagens:**

- ✅ Funciona sem configuração (OSRM)
- ✅ Melhora automaticamente com API key
- ✅ Fallback automático se Google falhar
- ✅ Sem necessidade de reescrever código

## 🚀 Como Obter API Key do Google Maps

### **Passo 1: Criar Conta Google Cloud**

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Aceite os termos de serviço

### **Passo 2: Criar Projeto**

1. Clique em "Select a project" no topo
2. Clique em "NEW PROJECT"
3. Nome do projeto: "FormiScanner" (ou qualquer nome)
4. Clique em "CREATE"

### **Passo 3: Ativar Billing**

⚠️ **Importante:** Você precisa adicionar um cartão, MAS:

- Você recebe $200 grátis por mês
- Não será cobrado automaticamente
- Você pode definir alertas de gastos

1. Menu lateral → "Billing"
2. Clique em "LINK A BILLING ACCOUNT"
3. Siga as instruções para adicionar cartão
4. **Configure alertas de gastos** (recomendado: $50)

### **Passo 4: Ativar APIs**

1. Menu lateral → "APIs & Services" → "Library"
2. Procure por "Directions API"
3. Clique em "Directions API"
4. Clique em "ENABLE"

### **Passo 5: Criar API Key**

1. Menu lateral → "APIs & Services" → "Credentials"
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "API key"
4. Copie a API key gerada

### **Passo 6: Restringir API Key (Segurança)**

⚠️ **Muito Importante para Segurança!**

1. Clique no ícone de edição da API key
2. Em "Application restrictions":
   - Selecione "HTTP referrers (web sites)"
   - Adicione: `http://localhost:3000/*`
   - Adicione: `https://seu-dominio.com/*` (quando publicar)
3. Em "API restrictions":
   - Selecione "Restrict key"
   - Marque apenas "Directions API"
4. Clique em "SAVE"

## 🔧 Configurar no Projeto

### **Opção 1: Arquivo .env.local (Recomendado)**

1. Crie arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_api_key_aqui
```

2. Reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### **Opção 2: Variável de Ambiente do Sistema**

**Windows:**

```cmd
setx NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "sua_api_key_aqui"
```

**Linux/Mac:**

```bash
export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua_api_key_aqui"
```

## ✅ Verificar se Está Funcionando

1. Abra o console do navegador (F12)
2. Crie uma rota no app
3. Procure por mensagens:

**Com API Key:**

```
Buscando rotas pelas ruas...
✅ Usando Google Maps Directions API
```

**Sem API Key:**

```
Buscando rotas pelas ruas...
ℹ️ Google Maps API key não configurada, usando OSRM
```

## 💰 Monitorar Custos

### **Configurar Alertas**

1. Google Cloud Console → "Billing"
2. "Budgets & alerts"
3. "CREATE BUDGET"
4. Configure:
   - Nome: "FormiScanner Alert"
   - Budget: $50
   - Alertas: 50%, 90%, 100%

### **Ver Uso**

1. Google Cloud Console → "APIs & Services" → "Dashboard"
2. Veja quantas requisições você fez
3. Calcule custo: (requisições / 1000) × $5

### **Exemplo de Uso Real**

```
Cenário: Empresa de entregas pequena
- 20 rotas por dia
- 30 dias por mês
- Total: 600 rotas/mês

Custo:
- 600 rotas = 600 requisições
- (600 / 1000) × $5 = $3/mês
- Crédito grátis: $200/mês
- Custo real: $0 (dentro do crédito grátis)
```

## 🔒 Segurança

### **Boas Práticas:**

1. ✅ **NUNCA** commite `.env.local` no Git
2. ✅ Restrinja a API key por domínio
3. ✅ Restrinja a API key por API
4. ✅ Configure alertas de gastos
5. ✅ Monitore uso regularmente

### **Arquivo .gitignore**

Certifique-se que `.env.local` está no `.gitignore`:

```
# .gitignore
.env.local
.env*.local
```

## 🆘 Troubleshooting

### **Erro: "REQUEST_DENIED"**

**Causa:** API key não configurada ou inválida

**Solução:**

1. Verifique se a API key está correta
2. Verifique se Directions API está ativada
3. Aguarde alguns minutos (propagação)

### **Erro: "OVER_QUERY_LIMIT"**

**Causa:** Excedeu limite de requisições

**Solução:**

1. Verifique billing no Google Cloud
2. Aumente limite ou aguarde reset mensal
3. Sistema volta automaticamente para OSRM

### **Rotas ainda usando OSRM**

**Causa:** API key não está sendo lida

**Solução:**

1. Verifique nome da variável: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Reinicie o servidor Next.js
3. Limpe cache: `rm -rf .next`

## 📈 Quando Vale a Pena?

### **Use OSRM (Gratuito) se:**

- ✅ Uso pessoal/hobby
- ✅ Poucas rotas por dia
- ✅ Não precisa de máxima precisão
- ✅ Quer zero custos

### **Use Google Maps se:**

- ✅ Uso profissional/comercial
- ✅ Precisa de máxima precisão
- ✅ Rotas em áreas urbanas complexas
- ✅ Quer dados sempre atualizados
- ✅ Pode investir ~$3-10/mês

## 🎉 Conclusão

**Você tem 3 opções:**

1. **Não fazer nada**: Continua usando OSRM (gratuito)
2. **Configurar Google Maps**: Melhor precisão ($0-10/mês)
3. **Testar ambos**: Configure e compare resultados

**Recomendação:**

- Comece com OSRM (já funciona)
- Se precisar de mais precisão, configure Google Maps
- Monitore custos nos primeiros meses

---

**Dúvidas?** Consulte:

- [Google Maps Pricing](https://mapsplatform.google.com/pricing/)
- [Directions API Docs](https://developers.google.com/maps/documentation/directions)
