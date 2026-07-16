// - Elements --
const modeBasic   = document.getElementById('modeBasic');
const modeHV      = document.getElementById('modeHV');
const basicSection = document.getElementById('basicSection');
const hvSection    = document.getElementById('hvSection');

const upperList = document.getElementById('upperList');
const lowerList = document.getElementById('lowerList');
const upperEqSpan = document.getElementById('upperEq');
const lowerEqSpan = document.getElementById('lowerEq');

const adcEnable  = document.getElementById('adcEnable');
const adcSection = document.getElementById('adcSection');
const vrefInput  = document.getElementById('vref');
const bitsSelect = document.getElementById('bits');

const calcBtn = document.getElementById('calcBtn');

// Results
const eqUpperEl = document.getElementById('eqUpper');
const eqLowerEl = document.getElementById('eqLower');
const ratioEl   = document.getElementById('ratio');
const currentEl = document.getElementById('current');
const voutEl    = document.getElementById('vout');
const adcEl     = document.getElementById('adc');
const statusEl  = document.getElementById('status');
const statusItem = statusEl.closest('.result-item');

const upperAnalysis = document.getElementById('upperAnalysis');
const lowerAnalysis = document.getElementById('lowerAnalysis');

// Helpers
function formatResistance(ohms){
  if (!isFinite(ohms)) return '--';
  if (ohms >= 1e6) return (ohms/1e6).toFixed(3).replace(/\.?0+$/,'') + ' MΩ';
  if (ohms >= 1e3) return (ohms/1e3).toFixed(3).replace(/\.?0+$/,'') + ' kΩ';
  return ohms.toFixed(2).replace(/\.?0+$/,'') + ' Ω';
}

function formatVoltage(v){
  if (!isFinite(v)) return '--';
  return v.toFixed(3).replace(/\.?0+$/,'') + ' V';
}

function formatCurrent(amps){
  if (!isFinite(amps)) return '--';
  if (Math.abs(amps) < 1e-3) return (amps*1e6).toFixed(2) + ' µA';
  if (Math.abs(amps) < 1) return (amps*1e3).toFixed(3) + ' mA';
  return amps.toFixed(4) + ' A';
}

function formatPower(watts){
  if (!isFinite(watts)) return '--';
  if (Math.abs(watts) < 1e-3) return (watts*1e6).toFixed(2) + ' µW';
  if (Math.abs(watts) < 1) return (watts*1e3).toFixed(3) + ' mW';
  return watts.toFixed(4) + ' W';
}

function setStatus(text, kind){
  statusEl.textContent = text;
  statusItem.classList.remove('status-ok','status-error','status-warn');
  if (kind) statusItem.classList.add('status-' + kind);
}

// Dynamic resistor rows ----###########
function makeRow(){
  const row = document.createElement('div');
  row.className = 'resistor-row';
  row.innerHTML = `
    <span class="row-label"></span>
    <input type="number" step="any" class="r-value" placeholder="Resistance">
    <select class="r-unit">
      <option value="1">Ω</option>
      <option value="1000">kΩ</option>
      <option value="1000000">MΩ</option>
    </select>
    <button type="button" class="remove-btn">➖</button>
  `;
  return row;
}

function addResistor(listEl){
  listEl.appendChild(makeRow());
  renumber(listEl);
  updateEquivalent(listEl);
}

function removeResistor(btn, listEl){
  const row = btn.closest('.resistor-row');
  if (listEl.children.length <= 1) return; // keep at least one row
  row.remove();
  renumber(listEl);
  updateEquivalent(listEl);
}

function renumber(listEl){
  const prefix = listEl === upperList ? 'RU' : 'RL';
  [...listEl.children].forEach((row, i) => {
    row.querySelector('.row-label').textContent = prefix + (i + 1);
  });
  [...listEl.querySelectorAll('.remove-btn')].forEach(b => {
    b.disabled = listEl.children.length <= 1;
  });
}

function readResistorList(listEl){
  return [...listEl.children].map(row => {
    const val = parseFloat(row.querySelector('.r-value').value);
    const mult = parseFloat(row.querySelector('.r-unit').value);
    const ohms = (isFinite(val) && val > 0) ? val * mult : NaN;
    const label = row.querySelector('.row-label').textContent;
    return { ohms, label };
  });
}

function updateEquivalent(listEl){
  const values = readResistorList(listEl);
  const span = listEl === upperList ? upperEqSpan : lowerEqSpan;
  if (values.some(v => !isFinite(v.ohms))){
    span.textContent = '-- Ω';
    return;
  }
  const total = values.reduce((sum, v) => sum + v.ohms, 0);
  span.textContent = formatResistance(total);
}

// seed one row each on load
addResistor(upperList);
addResistor(lowerList);

document.getElementById('addUpper').addEventListener('click', () => addResistor(upperList));
document.getElementById('addLower').addEventListener('click', () => addResistor(lowerList));

[upperList, lowerList].forEach(listEl => {
  listEl.addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) removeResistor(e.target, listEl);
  });
  listEl.addEventListener('input', () => updateEquivalent(listEl));
});

// - mode toggle-
function refreshMode(){
  const hv = modeHV.checked;
  basicSection.classList.toggle('hidden', hv);
  hvSection.classList.toggle('hidden', !hv);
}
modeBasic.addEventListener('change', refreshMode);
modeHV.addEventListener('change', refreshMode);

// ---ADC toggle
adcEnable.addEventListener('change', () => {
  adcSection.classList.toggle('hidden', !adcEnable.checked);
});

// ---Analysis check rendering --
function renderAnalysis(container, items, current){
  container.innerHTML = '';
  items.forEach(item => {
    const voltage = current * item.ohms;
    const power = current * current * item.ohms;
    const row = document.createElement('div');
    row.className = 'analysis-item';
    row.innerHTML = `
      <span class="a-label">${item.label} (${formatResistance(item.ohms)})</span>
      <span class="a-values">V = ${formatVoltage(voltage)} &nbsp;|&nbsp; P = ${formatPower(power)}</span>
    `;
    container.appendChild(row);
  });
}

// ---- ADC calculation 
function calcAdc(vout){
  if (!adcEnable.checked) return { text: '--', warn: false };
  const vref = parseFloat(vrefInput.value);
  const bits = parseInt(bitsSelect.value, 10);
  if (!isFinite(vref) || vref <= 0) return { text: 'Set Vref', warn: true };
  const maxCount = Math.pow(2, bits) - 1;
  let count = Math.round((vout / vref) * maxCount);
  const saturated = count > maxCount || count < 0;
  count = Math.min(maxCount, Math.max(0, count));
  return { text: `${count} / ${maxCount}`, warn: saturated };
}

// ---Main calculation --
function calculate(){
  const hv = modeHV.checked;
  let vin, upperOhms, lowerOhms, upperItems, lowerItems;

  if (!hv){
    vin = parseFloat(document.getElementById('vin').value);
    const r1 = parseFloat(document.getElementById('r1').value);
    const r1u = parseFloat(document.getElementById('r1unit').value);
    const r2 = parseFloat(document.getElementById('r2').value);
    const r2u = parseFloat(document.getElementById('r2unit').value);

    if (![vin, r1, r2].every(n => isFinite(n) && !isNaN(n)) || r1 <= 0 || r2 <= 0){
      setStatus('Enter valid Vin, R1, R2', 'error');
      return;
    }
    upperOhms = r1 * r1u;
    lowerOhms = r2 * r2u;
    upperItems = [{ ohms: upperOhms, label: 'R1' }];
    lowerItems = [{ ohms: lowerOhms, label: 'R2' }];
  } else {
    vin = parseFloat(document.getElementById('hvVin').value);
    upperItems = readResistorList(upperList);
    lowerItems = readResistorList(lowerList);

    if (!isFinite(vin) || upperItems.some(i => !isFinite(i.ohms)) || lowerItems.some(i => !isFinite(i.ohms))){
      setStatus('Enter valid Vin and resistor values', 'error');
      return;
    }
    upperOhms = upperItems.reduce((s, i) => s + i.ohms, 0);
    lowerOhms = lowerItems.reduce((s, i) => s + i.ohms, 0);
  }

  const total = upperOhms + lowerOhms;
  if (total <= 0){
    setStatus('Total resistance must be > 0', 'error');
    return;
  }

  const ratio = lowerOhms / total;
  const current = vin / total;
  const vout = vin * ratio;

  eqUpperEl.textContent = formatResistance(upperOhms);
  eqLowerEl.textContent = formatResistance(lowerOhms);
  ratioEl.textContent = ratio.toFixed(4);
  currentEl.textContent = formatCurrent(current);
  voutEl.textContent = formatVoltage(vout);

  const adcResult = calcAdc(vout);
  adcEl.textContent = adcResult.text;

  renderAnalysis(upperAnalysis, upperItems, current);
  renderAnalysis(lowerAnalysis, lowerItems, current);

  if (adcResult.warn){
    setStatus('ADC saturated / check Vref', 'warn');
  } else {
    setStatus('OK', 'ok');
  }
}

calcBtn.addEventListener('click', calculate);

// initial UI state
refreshMode();
