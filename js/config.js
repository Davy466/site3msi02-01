/**
 * HAMILTON SAFEHOUSE - Configurações Globais
 * Não insira lógicas aqui, apenas constantes.
 */
const CONFIG = {
    BLE: {
        SERVICE_UUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        DATA_CHARACTERISTIC_UUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
        COMMAND_CHARACTERISTIC_UUID: "8c1e0001-1fb5-459e-8fcc-c5c9c331914b" // UUID adicionado!
    },
    
    LIMITS: {
        TEMPERATURE: {
            WARNING: 30.0, // Acima disto = Atenção
            CRITICAL: 40.0 // Acima disto = Perigo
        },
        HUMIDITY: {
            WARNING_LOW: 30.0,
            WARNING_HIGH: 70.0
        }
    },
    
    FEATURES: {
        ENERGY_SENSOR_ENABLED: true, // Alterado para true para o PZEM-004T
        CHART_MAX_POINTS: 20 // Máximo de pontos exibidos no gráfico em tempo real
    }
};