document.getElementById("adcEnable").addEventListener("change", function(){

document.getElementById("adcSection").style.display =
this.checked ? "block" : "none";

});

function calculate(){

let vin=parseFloat(document.getElementById("vin").value);

let r1=parseFloat(document.getElementById("r1").value);

let r2=parseFloat(document.getElementById("r2").value);

if(isNaN(vin)||isNaN(r1)||isNaN(r2)||r1<=0||r2<=0){

alert("Please enter valid values.");

return;

}

let vout=vin*r2/(r1+r2);

document.getElementById("voutText").innerHTML=

"<b>Vout :</b> "+vout.toFixed(4)+" V";

document.getElementById("adcText").innerHTML="";

document.getElementById("warning").innerHTML="";

if(document.getElementById("adcEnable").checked){

let vref=parseFloat(document.getElementById("vref").value);

let bits=parseInt(document.getElementById("bits").value);

let max=(2**bits)-1;

let adc=Math.round((vout/vref)*max);

if(adc>max) adc=max;

document.getElementById("adcText").innerHTML=

"<b>ADC Count :</b> "+adc+" / "+max;

if(vout>vref){

document.getElementById("warning").innerHTML=

"Warning : Voltage exceeds Vref. ADC will saturate.";

document.getElementById("warning").style.color="red";

}

else{

document.getElementById("warning").innerHTML=

"Voltage is within ADC range.";

document.getElementById("warning").style.color="lime";

}

}

}
