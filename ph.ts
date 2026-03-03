/**
 * Custom blocks para el sensor Gravity Analog pH Sensor V2 (SEN0161-V2)
 * Version sin dependencias externas
 */
//% weight=100 color=#0fbc11 icon=""

namespace PH {

    let pHPin: AnalogPin = AnalogPin.P0;
    let neutralVoltage: number = 1500;
    let acidVoltage: number = 2032;
    let slope: number = 0;
    let offset: number = 0;
    const microbitVoltage: number = 3300;
    const CALIBRATION_SAMPLES: number = 50;

    function calcularRecta() {
        slope = (7 - 4) / (neutralVoltage - acidVoltage);
        offset = 7 - slope * neutralVoltage;
    }

    function readVoltage(): number {
        const rawValue: number = pins.analogReadPin(pHPin);
        const voltage: number = rawValue * microbitVoltage / 1023;
        return voltage;
    }

    function esperarBotonA() {
        while (input.buttonIsPressed(Button.A)) {
            basic.pause(50);
        }
        control.waitForEvent(
            EventBusSource.MICROBIT_ID_BUTTON_A,
            EventBusValue.MICROBIT_EVT_ANY
        );
        basic.pause(200);
    }

    function calibratePH(phValue: number) {
        serial.writeLine("Calibrando...");

        let sumVoltage: number = 0;
        for (let i = 0; i < CALIBRATION_SAMPLES; i++) {
            sumVoltage += readVoltage();
            basic.pause(100);
            if (i % 10 == 0) {
                basic.showNumber(phValue);
            } else {
                basic.clearScreen();
            }
        }
        const averageVoltage = sumVoltage / CALIBRATION_SAMPLES;

        if (phValue === 7.0) {
            neutralVoltage = averageVoltage;
            basic.showIcon(IconNames.Yes);
            serial.writeLine("pH7 OK (" + neutralVoltage + "mV)");
        } else if (phValue === 4.0) {
            acidVoltage = averageVoltage;
            basic.showIcon(IconNames.Yes);
            serial.writeLine("pH4 OK (" + acidVoltage + "mV)");
        } else {
            basic.showString("Error PH");
            serial.writeLine("Error PH");
        }
    }

    /**
     * Guia al usuario en el proceso de calibracion
     * @param pin pin analogico al que se conecto el sensor
     */
    //% blockId=Calibrar_sensor block="Calibrar sensor conectado en %pin"
    export function CalibrarSensor(pin: AnalogPin) {
        pHPin = pin;

        basic.showString("4");
        serial.writeLine("Coloque el electrodo en el Buffer de PH4 y presione A");
        esperarBotonA();
        calibratePH(4);
        basic.pause(200);

        basic.showString("7");
        serial.writeLine("Coloque el electrodo en el Buffer de PH7 y presione A");
        esperarBotonA();
        calibratePH(7);
        basic.pause(200);

        calcularRecta();
        serial.writeLine("Calibracion completa.");
        serial.writeLine("Slope: " + slope + " Offset: " + offset);
    }

    /**
     * Devuelve el valor de pH (entre 0 y 14)
     */
    //% blockId=medirPH block="valor de pH"
    export function medirPh(): number {
        let voltage = readVoltage();
        let phValue: number;

        if (neutralVoltage === acidVoltage) {
            return 0;
        }

        phValue = slope * voltage + offset;

        if (phValue < 0) {
            phValue = 0;
        } else if (phValue > 14) {
            phValue = 14;
        }

        return phValue;
    }
}