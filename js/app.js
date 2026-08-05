/**
 * HAMILTON SAFEHOUSE - Lógica Principal do Dashboard
 */
const app = {
    ble: null,
    isDemoMode: false,
    demoInterval: null,
    chart: null,
    historyData: [],

    init: function() {
        // Remover Loading
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden-hard');
        }, 1500);

        // Inicializar BLE
        this.ble = new BLEManager(this.processData.bind(this), this.handleDisconnect.bind(this));

        // Eventos de Botões
        document.getElementById('btn-connect').addEventListener('click', () => this.connectBLE());
        document.getElementById('btn-disconnect').addEventListener('click', () => this.disconnectBLE());
        document.getElementById('btn-demo').addEventListener('click', () => this.toggleDemoMode());
        document.getElementById('btn-clear-history').addEventListener('click', () => {
            this.historyData = [];
            this.updateHistoryTable();
        });

        this.initChart();
        this.logAlert('Sistema inicializado. Aguardando conexão.', 'info');
    },

    // --- BLE e Modos ---

    async connectBLE() {
        if (this.isDemoMode) this.toggleDemoMode(); // Desliga demo se for conectar real

        const statusText = document.getElementById('ble-status-text');
        statusText.textContent = '🟡 Conectando...';
        
        try {
            await this.ble.connect();
            statusText.textContent = `🟢 Conectado ao ESP32`;
            document.getElementById('btn-connect').classList.add('hidden');
            document.getElementById('btn-disconnect').classList.remove('hidden');
            this.logAlert('Conexão BLE estabelecida com sucesso.', 'info');
        } catch (error) {
            statusText.textContent = '⚠️ Erro de conexão';
            this.logAlert('Falha ao tentar conectar ao ESP32.', 'danger');
        }
    },

    disconnectBLE() {
        this.ble.disconnect();
    },

    handleDisconnect() {
        document.getElementById('ble-status-text').textContent = '🔴 ESP32 DESCONECTADO';
        document.getElementById('btn-connect').classList.remove('hidden');
        document.getElementById('btn-disconnect').classList.add('hidden');
        this.logAlert('Conexão com o dispositivo perdida. Os dados exibidos são os últimos recebidos.', 'warning');
    },

    sendTestCommand(command) {
        if (this.isDemoMode) {
            this.logAlert(`Comando simulado (Modo Demo): ${command}`, 'info');
            return;
        }
        this.ble.sendCommand(command);
    },

    // --- Processamento de Dados (Reais ou Simulados) ---

    processData(data) {
        // Validação básica
        if (typeof data.temperature !== 'number' || typeof data.humidity !== 'number') {
            console.warn("Dados incompletos recebidos.");
            return;
        }

        this.updateDashboard(data);
        this.updateCharts(data);
        this.saveHistory(data);
    },

    updateDashboard(data) {
        // 1. Temperatura
        document.getElementById('val-temp').textContent = data.temperature.toFixed(1);
        const tempStatusEl = document.getElementById('status-temp');
        if (data.temperature >= CONFIG.LIMITS.TEMPERATURE.CRITICAL) {
            tempStatusEl.textContent = 'Crítico'; tempStatusEl.className = 'card-status text-danger';
        } else if (data.temperature >= CONFIG.LIMITS.TEMPERATURE.WARNING) {
            tempStatusEl.textContent = 'Atenção'; tempStatusEl.className = 'card-status text-warning';
        } else {
            tempStatusEl.textContent = 'Normal'; tempStatusEl.className = 'card-status text-normal';
        }

        // 2. Umidade e Água
        document.getElementById('val-hum').textContent = data.humidity.toFixed(1);
        document.getElementById('val-flow').textContent = (data.waterFlow || 0).toFixed(1);
        document.getElementById('val-water-total').textContent = (data.waterTotal || 0).toFixed(1);

        // 3. Energia (PZEM-004T) - NOVOS CAMPOS
        document.getElementById('val-voltage').textContent = (data.voltage || 0).toFixed(1);
        document.getElementById('val-current').textContent = (data.current || 0).toFixed(2);
        document.getElementById('val-power').textContent = (data.power || 0).toFixed(1);
        document.getElementById('val-energy').textContent = (data.energy || 0).toFixed(3);

        // 4. Chama e Segurança Geral
        const flameEl = document.getElementById('val-flame');
        const statusCard = document.getElementById('home-status');
        const statusText = document.getElementById('home-status-text');

        if (data.flame) {
            flameEl.textContent = '⚠️ POSSÍVEL CHAMA DETECTADA';
            flameEl.className = 'card-value text-small text-danger';
            data.securityStatus = 'perigo'; // Força perigo se houver chama
        } else {
            flameEl.textContent = 'Nenhuma chama detectada';
            flameEl.className = 'card-value text-small text-normal';
        }

        // Atualiza Estado da Residência
        statusCard.className = 'status-card';
        if (data.securityStatus === 'perigo') {
            statusCard.classList.add('danger');
            statusText.textContent = 'PERIGO';
            statusCard.querySelector('.status-icon').textContent = '🔴';
        } else if (data.securityStatus === 'atencao') {
            statusCard.classList.add('warning');
            statusText.textContent = 'ATENÇÃO';
            statusCard.querySelector('.status-icon').textContent = '🟡';
        } else {
            statusCard.classList.add('normal');
            statusText.textContent = 'NORMAL';
            statusCard.querySelector('.status-icon').textContent = '🟢';
        }

        // 5. Atuadores (LEDs e Buzzer)
        document.getElementById('led-green').classList.toggle('active', data.greenLed);
        document.getElementById('led-yellow').classList.toggle('active', data.yellowLed);
        document.getElementById('led-red').classList.toggle('active', data.redLed);
        
        const buzzerEl = document.getElementById('buzzer-status');
        if (data.buzzer) {
            buzzerEl.textContent = '🔊 ATIVO';
            buzzerEl.classList.add('text-danger');
            if(data.flame) this.logAlert('Emergência! Chama detectada e alarme acionado!', 'danger');
        } else {
            buzzerEl.textContent = '🔇 Inativo';
            buzzerEl.classList.remove('text-danger');
        }
    },

    // --- Componentes Visuais ---

    logAlert(message, type = 'info') {
        const list = document.getElementById('alert-list');
        const li = document.createElement('li');
        li.className = `alert-item ${type}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        
        let icon = '🟢';
        if (type === 'warning') icon = '🟡';
        if (type === 'danger') icon = '🔴';

        li.textContent = `${icon} ${timeStr} - ${message}`;
        list.prepend(li); // Adiciona no topo
        
        // Mantém apenas os últimos 20 alertas
        if (list.children.length > 20) {
            list.removeChild(list.lastChild);
        }
    },

    initChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Temperatura (°C)', borderColor: '#ef4444', data: [], tension: 0.4 },
                    { label: 'Umidade (%)', borderColor: '#3b82f6', data: [], tension: 0.4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { display: false } },
                plugins: { legend: { labels: { color: '#f8fafc' } } }
            }
        });
    },

    updateCharts(data) {
        const now = new Date().toLocaleTimeString();
        
        this.chart.data.labels.push(now);
        this.chart.data.datasets[0].data.push(data.temperature);
        this.chart.data.datasets[1].data.push(data.humidity);

        if (this.chart.data.labels.length > CONFIG.FEATURES.CHART_MAX_POINTS) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
            this.chart.data.datasets[1].data.shift();
        }
        this.chart.update('none'); // Update sem animação pesada
    },

    saveHistory(data) {
        const now = new Date().toLocaleTimeString();
        this.historyData.unshift({ time: now, ...data });
        if (this.historyData.length > 50) this.historyData.pop(); // Limite de 50 registros
        this.updateHistoryTable();
    },

    updateHistoryTable() {
        const tbody = document.getElementById('history-body');
        tbody.innerHTML = '';
        this.historyData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.time}</td>
                <td>${row.temperature.toFixed(1)}</td>
                <td>${row.humidity.toFixed(1)}</td>
                <td>${(row.waterFlow || 0).toFixed(1)}</td>
                <td>${row.securityStatus.toUpperCase()}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- Modo Demonstração ---

    toggleDemoMode() {
        this.isDemoMode = !this.isDemoMode;
        const badge = document.getElementById('demo-badge');
        
        if (this.isDemoMode) {
            this.disconnectBLE();
            badge.classList.remove('hidden');
            this.logAlert('Modo Demonstração Ativado.', 'warning');
            
            let cycle = 0;
            this.demoInterval = setInterval(() => {
                cycle++;
                
                // Simula corrente variando para gerar a potência
                const simCurrent = Math.random() * 5;
                const simVoltage = 127 + (Math.random() * 4 - 2); // Simula oscilação na rede de 127V
                
                // Simula um JSON vindo do ESP32 com os novos dados elétricos
                const mockData = {
                    temperature: 24 + Math.sin(cycle * 0.5) * 5, // Varia de 19 a 29
                    humidity: 50 + Math.cos(cycle * 0.5) * 10,
                    waterFlow: cycle % 5 === 0 ? 1.5 : 0.0,
                    waterTotal: cycle * 0.1,
                    voltage: simVoltage,
                    current: simCurrent,
                    power: simVoltage * simCurrent,
                    energy: cycle * 0.002, // Simula consumo acumulando
                    flame: cycle % 15 === 0, // Fogo a cada 15 ciclos
                    securityStatus: cycle % 15 === 0 ? 'perigo' : (cycle % 10 === 0 ? 'atencao' : 'normal'),
                    greenLed: cycle % 15 !== 0 && cycle % 10 !== 0,
                    yellowLed: cycle % 10 === 0 && cycle % 15 !== 0,
                    redLed: cycle % 15 === 0,
                    buzzer: cycle % 15 === 0
                };
                
                this.processData(mockData);
            }, 2000);
        } else {
            badge.classList.add('hidden');
            clearInterval(this.demoInterval);
            this.logAlert('Modo Demonstração Desativado.', 'info');
        }
    }
};

// Iniciar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => app.init());