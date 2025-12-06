# 📍 Implementação de Localização Atual

## Funcionalidade Solicitada:

Adicionar botão para usar localização atual como ponto de partida da rota

## Tarefas:

### 1. **components/route-map.tsx**

- [ ] Adicionar botão "Usar Minha Localização" na interface
- [ ] Implementar função para capturar localização atual
- [ ] Adicionar estado para armazenar localização atual
- [ ] Modificar fluxo de otimização para incluir localização atual

### 2. **lib/route-optimizer.ts**

- [ ] Modificar função `optimizeRoute` para aceitar localização atual opcional
- [ ] Usar localização atual como primeiro ponto da rota
- [ ] Ajustar algoritmo de otimização para considerar ponto de partida fixo

### 3. **types/route.ts**

- [ ] Adicionar tipo para localização atual (opcional)

### 4. **Testes**

- [ ] Testar captura de localização
- [ ] Testar integração com otimização de rota
- [ ] Testar casos onde localização não está disponível

## Status: Em Progresso
