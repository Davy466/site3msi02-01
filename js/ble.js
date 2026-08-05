/**
 * HAMILTON SAFEHOUSE - Módulo BLE
 */
class BLEManager {
    constructor(onDataReceived, onDisconnect) {
        this.device = null;
        this.server = null;
        this.dataCharacteristic = null;
        this.commandCharacteristic = null;
        this.onDataReceived = onDataReceived; // Callback para quando os dados chegam
        this.onDisconnect = onDisconnect;     // Callback para desconexão
    }

    async connect() {
        try {
            // 1. Solicita dispositivo com o serviço UUID específico
           this.device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [CONFIG.BLE.SERVICE_UUID]
});

            this.device.addEventListener('gattserverdisconnected', this.onDisconnect);

            // 2. Conecta ao servidor GATT
            this.server = await this.device.gatt.connect();

            // 3. Obtém o serviço
            const service = await this.server.getPrimaryService(CONFIG.BLE.SERVICE_UUID);

            // 4. Configura característica de Leitura/Notificação (Dados)
            this.dataCharacteristic = await service.getCharacteristic(CONFIG.BLE.DATA_CHARACTERISTIC_UUID);
            await this.dataCharacteristic.startNotifications();
            this.dataCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotifications.bind(this));

            // 5. Tenta obter a característica de Escrita (Comandos) - Opcional nesta fase
            try {
                this.commandCharacteristic = await service.getCharacteristic(CONFIG.BLE.COMMAND_CHARACTERISTIC_UUID);
            } catch (e) {
                console.warn("Característica de comando não encontrada. Testes de atuadores desativados.");
            }

            return true;

        } catch (error) {
            console.error("Erro BLE:", error);
            throw error;
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }

    handleNotifications(event) {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(value);
        
        try {
            const data = JSON.parse(jsonString);
            this.onDataReceived(data);
        } catch (e) {
            console.error("Recebeu JSON inválido do ESP32:", jsonString);
        }
    }

    async sendCommand(commandString) {
        if (!this.commandCharacteristic) {
            console.warn("Comandos BLE não estão disponíveis.");
            return false;
        }
        try {
            const encoder = new TextEncoder();
            await this.commandCharacteristic.writeValue(encoder.encode(commandString));
            return true;
        } catch (error) {
            console.error("Erro ao enviar comando:", error);
            return false;
        }
    }
}