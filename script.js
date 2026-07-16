// Show / Hide ADC Section

document.getElementById("adcEnable").addEventListener("change", function () {

    document.getElementById("adcSection").style.display =
        this.checked ? "block" : "none";

});

function calculate() {

    let vin = parseFloat(document.getElementById("vin").value);

    let r1 = parseFloat(document.getElementById("r1").value);
    let r2 = parseFloat(document.getElementById("r2").value);

    if (isNaN(vin) || isNaN(r1) || isNaN(r2) || r1 <= 0 || r2 <= 0) {

        alert("Please enter valid values.");

        return;

    }

    // Convert resistor units

    r1 *= parseFloat(document.getElementById("r1unit").value);
    r2 *= parseFloat(document.getElementById("r2unit").value);

    // Voltage Divider

    let vout = vin * r2 / (r1 + r2);

    document.getElementById("voutText").innerHTML =
        vout.toFixed(4) + " V";

    document.getElementById("adcText").innerHTML = "--";

    document.getElementById("warning").innerHTML = "Calculation Complete";
    document.getElementById("warning").style.color = "#2C3E50";

    // ADC Calculation

    if (document.getElementById("adcEnable").checked) {

        let vref = parseFloat(document.getElementById("vref").value);

        if (isNaN(vref) || vref <= 0) {

            alert("Please enter MCU Vref.");

            return;

        }

        let bits = parseInt(document.getElementById("bits").value);

        let maxADC = Math.pow(2, bits) - 1;

        let adc = Math.round((vout / vref) * maxADC);

        if (adc > maxADC)
            adc = maxADC;

        if (adc < 0)
            adc = 0;

        document.getElementById("adcText").innerHTML =
            adc + " / " + maxADC;

        if (vout > vref) {

            document.getElementById("warning").innerHTML =
                "Your Input Voltage exceeds MCU Vref";

            document.getElementById("warning").style.color = "red";

        }

        else {

            document.getElementById("warning").innerHTML =
                "Your Voltage within ADC range";

            document.getElementById("warning").style.color = "green";

        }

    }

}
