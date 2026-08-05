# Hamilton SafeHouse - Dashboard Web

Sistema Inteligente de Segurança e Economia Residencial, desenvolvido para feira de ciências. Inspirado na confiabilidade do software criado por Margaret Hamilton.

## Como Executar Localmente
Para que a `Web Bluetooth API` funcione, ela exige um contexto seguro. Você não pode simplesmente abrir o `index.html` clicando duas vezes.
1. Utilize uma extensão como **Live Server** (VS Code) ou rode um servidor Python local:
   `python -m http.server 8000`
2. Acesse no navegador: `http://localhost:8000` (Localhost é considerado seguro pelo navegador).

## Publicação no GitHub Pages
O projeto é 100% estático (HTML/CSS/JS) e não necessita de Backend.
1. Faça o commit de todos os arquivos para o seu repositório no GitHub.
2. Vá em `Settings > Pages`, selecione a branch `main` e salve.
3. O GitHub servirá seu site através de `HTTPS`, o que atende perfeitamente aos requisitos da Web Bluetooth API.

## Navegadores Compatíveis
- Google Chrome (Desktop / Android)
- Microsoft Edge
- Opera
- *Nota: Dispositivos iOS (iPhone/iPad) limitam o Web Bluetooth em navegadores nativos. Utilize um PC ou Android para a apresentação.*

## Protocolo de Comunicação ESP32 → Dashboard
O código C++ do seu ESP32 deve ler os sensores físicos e enviar os dados através do Data Characteristic do BLE formatados **exatamente** neste formato JSON (como string texto):

```json
{
  "temperature": 27.4,
  "humidity": 63.0,
  "waterFlow": 1.8,
  "waterTotal": 42.5,
  "flame": false,
  "securityStatus": "normal",
  "greenLed": true,
  "yellowLed": false,
  "redLed": false,
  "buzzer": false
}