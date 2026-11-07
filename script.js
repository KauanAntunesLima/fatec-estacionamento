(() => {
  "use strict";
  const STORAGE_KEY = "parkcorp_local_v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pad = n => String(n).padStart(2, "0");
  const now = () => new Date();
  const dateTime = d => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const time = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const todayKey = () => { const d=now(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function seedData() {
    const vehicles = [
      ["ABC1D23","Toyota Corolla","Prata","A01",true,42],
      ["BRA2E34","Honda Civic","Preto","A02",true,35],
      ["CDE3F45","Jeep Compass","Branco","A03",true,29],
      ["FGH4I56","VW T-Cross","Cinza","A04",true,21],
      ["JKL5M67","Hyundai HB20","Azul","B01",true,16],
      ["MNO6P78","Chevrolet Onix","Branco","B02",true,12],
      ["PQR7S89","Fiat Pulse","Vermelho","B03",true,8],
      ["TUV8W90","Nissan Kicks","Prata","B04",true,4]
    ].map((v,i)=>({id:`seed-${i}`,plate:v[0],model:v[1],color:v[2],spot:v[3],inside:v[4],entered:new Date(Date.now()-v[5]*60000).toISOString(),exited:null}));
    const activities = vehicles.map(v=>({id:`act-${v.id}`,type:"entry",plate:v.plate,spot:v.spot,at:v.entered}));
    return {capacity:24,garageName:"ParkCorp",unit:"Unidade Matriz",baseFee:30,hourlyFee:5,payments:[],vehicles,activities,createdToday:12,notifications:true};
  }
  function loadState() {
    try {
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(saved && Array.isArray(saved.vehicles) && Array.isArray(saved.activities)) return {...seedData(),...saved};
    } catch(e) { console.warn("Não foi possível ler os dados locais.",e); }
    return seedData();
  }
  let state=loadState();
  let spotFilter="all";
  const defaultSpots=()=>Array.from({length:state.capacity},(_,i)=>`V${String(i+1).padStart(2,"0")}`);
  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
  function activeVehicles(){return state.vehicles.filter(v=>v.inside);}
  function occupiedSpots(){return new Set(activeVehicles().map(v=>v.spot));}
  function reservedSpots(){return new Set(state.reserved||[]);}
  function spotStatus(spot){return occupiedSpots().has(spot)?"occupied":reservedSpots().has(spot)?"reserved":"available";}
  function allSpots(){return defaultSpots();}
  function counts(){const occupied=occupiedSpots().size,reserved=reservedSpots().size,available=Math.max(0,state.capacity-occupied-reserved);return {occupied,reserved,available,total:state.capacity,rate:Math.round(occupied/state.capacity*100)||0};}
  function notify(message,type="success"){const el=document.createElement("div");el.className=`toast ${type==="error"?"error":""}`;el.textContent=message;$("#toastContainer").append(el);setTimeout(()=>el.remove(),3200);}
  function renderStats(){
    const c=counts();
    [["#totalSpots",c.total],["#occupiedSpots",c.occupied],["#availableSpots",c.available],["#occupancyRate",`${c.rate}%`],["#dashAvailable",c.available],["#dashOccupied",c.occupied],["#donutPercent",`${c.rate}%`],["#legendOccupied",c.occupied],["#legendAvailable",c.available],["#reportInside",c.occupied],["#reportFree",c.available],["#reportRate",`${c.rate}%`],["#reportMovements",state.activities.length],["#todayVehicles",state.createdToday]].forEach(([s,v])=>{const el=$(s);if(el)el.textContent=v;});
    const donut=$("#occupancyDonut");if(donut)donut.style.background=`conic-gradient(var(--amber) 0 ${c.rate}%,#e7f3ed ${c.rate}% 100%)`;
    $("#year").textContent=now().getFullYear();
    $("#currentDate").textContent=now().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"});
    document.title=`${state.garageName} | Estacionamento Empresarial`;
  }
  function spotMarkup(spot){
    const status=spotStatus(spot),vehicle=activeVehicles().find(v=>v.spot===spot);
    const labels={available:"Livre",occupied:"Ocupada",reserved:"Reservada"};
    return `<button class="spot ${status}" data-spot="${spot}" title="${spot} · ${labels[status]}"><span class="spot-vehicle">${status==="occupied"?"▰":status==="reserved"?"◆":"✓"}</span><strong>${spot}</strong><small>${status==="occupied"?escapeHtml(vehicle?.plate||"Veículo"):labels[status]}</small></button>`;
  }
  function renderSpots(){
    const dash=$("#dashboardSpots"),all=$("#allSpots");
    if(dash)dash.innerHTML=allSpots().slice(0,12).map(spotMarkup).join("");
    if(all)all.innerHTML=allSpots().filter(s=>spotFilter==="all"||spotStatus(s)===spotFilter).map(spotMarkup).join("")||'<p class="empty-state">Nenhuma vaga neste filtro.</p>';
    bindSpotButtons();
  }
  function bindSpotButtons(){
    $$("[data-spot]").forEach(btn=>btn.addEventListener("click",()=>{const spot=btn.dataset.spot,status=spotStatus(spot),vehicle=activeVehicles().find(v=>v.spot===spot);if(status==="occupied"){notify(`${spot}: ${vehicle?.plate||"veículo"} está estacionado.`);}else if(status==="reserved"){notify(`${spot} está reservada.`);}else{openEntry(spot);}}));
  }
  function renderActivity(){
    const list=$("#recentActivity");if(!list)return;
    const items=[...state.activities].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,5);
    list.innerHTML=items.length?items.map(a=>`<div class="activity-item"><div class="activity-icon ${a.type==="exit"?"out":""}">${a.type==="exit"?"↗":"↙"}</div><div class="activity-info"><b>${a.type==="exit"?"Saída":"Entrada"} · ${escapeHtml(a.plate)}</b><small>${a.type==="exit"?"Veículo liberou a vaga":"Vaga "+escapeHtml(a.spot)+" ocupada"}</small></div><span class="activity-time">${time(new Date(a.at))}</span></div>`).join(""):'<p class="empty-state">Nenhuma movimentação registrada.</p>';
  }
  function renderVehicles(){
    const body=$("#vehicleTable");if(!body)return;
    const q=($("#vehicleSearch")?.value||"").trim().toUpperCase(),filter=$("#vehicleStatus")?.value||"all";
    const rows=[...state.vehicles].sort((a,b)=>new Date(b.entered)-new Date(a.entered)).filter(v=>(filter==="all"||(filter==="inside"?v.inside:!v.inside))&&(`${v.plate} ${v.model} ${v.spot}`).toUpperCase().includes(q));
    body.innerHTML=rows.length?rows.map(v=>`<tr><td><span class="vehicle-name">${escapeHtml(v.model||"Veículo não informado")}</span><br><small>${escapeHtml(v.color||"")}</small></td><td><span class="plate">${escapeHtml(v.plate)}</span></td><td>${escapeHtml(v.spot)}</td><td>${dateTime(new Date(v.entered))}</td><td>${v.exited?dateTime(new Date(v.exited)):"—"}</td><td><span class="status-tag ${v.inside?"inside":"exited"}">${v.inside?"No pátio":"Finalizado"}</span></td><td>${v.inside?`<button class="table-action" data-exit="${v.id}">Registrar saída</button>`:"—"}</td></tr>`).join(""):'<tr><td colspan="7">Nenhum veículo encontrado.</td></tr>';
    $("#vehicleCount").textContent=`Exibindo ${rows.length} de ${state.vehicles.length} registros`;
    $$("[data-exit]").forEach(b=>b.addEventListener("click",()=>registerExit(b.dataset.exit)));
  }
  function renderReports(){
    const body=$("#reportTable");if(!body)return;
    const items=[...state.activities].sort((a,b)=>new Date(b.at)-new Date(a.at));
    body.innerHTML=items.length?items.map(a=>{const d=new Date(a.at);return `<tr><td>${d.toLocaleDateString("pt-BR")}</td><td>${time(d)}</td><td><span class="plate">${escapeHtml(a.plate)}</span></td><td><span class="status-tag ${a.type==="entry"?"inside":"exited"}">${a.type==="entry"?"Entrada":"Saída"}</span></td><td>${escapeHtml(a.spot||"—")}</td></tr>`;}).join(""):'<tr><td colspan="5">Sem movimentações.</td></tr>';
    const payments=$("#paymentsTable");
    if(payments){const list=[...(state.payments||[])].sort((a,b)=>new Date(b.paidAt)-new Date(a.paidAt));payments.innerHTML=list.length?list.map(x=>`<tr><td>${dateTime(new Date(x.paidAt))}</td><td><span class="plate">${escapeHtml(x.plate)}</span></td><td>${escapeHtml(x.durationLabel)}</td><td>${({debit:"Débito",credit:"Crédito",pix:"PIX"})[x.method]||escapeHtml(x.method)}</td><td><b>${money(x.amount)}</b></td><td><span class="status-tag inside">Registrado</span></td></tr>`).join(""):'<tr><td colspan="6">Nenhum pagamento registrado.</td></tr>';}
  }
  function render(){
    renderStats();renderSpots();renderActivity();renderVehicles();renderReports();
    $("#garageName").value=state.garageName;$("#garageCapacity").value=state.capacity;$("#garageUnit").value=state.unit;$("#baseFee").value=Number(state.baseFee??30).toFixed(2);$("#hourlyFee").value=Number(state.hourlyFee??5).toFixed(2);$("#notifications").checked=state.notifications!==false;
  }
  function showView(name){
    $$(".page").forEach(p=>p.classList.toggle("active",p.id===`view-${name}`));
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    const active=$(`.nav-item[data-view="${name}"]`);$("#pageCrumb").textContent=active?active.textContent.trim():"Visão geral";
    $("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  }
  function openEntry(preferredSpot=""){
    const free=allSpots().filter(s=>spotStatus(s)==="available");
    if(!free.length){notify("Não há vagas disponíveis no momento.","error");return;}
    $("#entrySpot").innerHTML=free.map(s=>`<option ${s===preferredSpot?"selected":""} value="${s}">${s}</option>`).join("");
    $("#entryPlate").value="";$("#entryModel").value="";$("#entryColor").value="";
    $("#entryModal").classList.remove("hidden");setTimeout(()=>$("#entryPlate").focus(),80);
  }
  function closeEntry(){$("#entryModal").classList.add("hidden");}
  function addActivity(type,vehicle){state.activities.push({id:`${Date.now()}-${Math.random()}`,type,plate:vehicle.plate,spot:vehicle.spot,at:new Date().toISOString()});}
  function registerEntry(event){
    event.preventDefault();
    const plate=$("#entryPlate").value.replace(/[^a-z0-9]/gi,"").toUpperCase();
    const spot=$("#entrySpot").value;
    if(plate.length<7){notify("Informe uma placa válida com 7 caracteres.","error");return;}
    if(state.vehicles.some(v=>v.inside&&v.plate===plate)){notify("Este veículo já está no estacionamento.","error");return;}
    if(spotStatus(spot)!=="available"){notify("Esta vaga não está mais disponível.","error");return;}
    const vehicle={id:`v-${Date.now()}`,plate,model:$("#entryModel").value.trim()||"Veículo não informado",color:$("#entryColor").value.trim(),spot,inside:true,entered:new Date().toISOString(),exited:null};
    state.vehicles.push(vehicle);state.createdToday=(state.createdToday||0)+1;addActivity("entry",vehicle);save();closeEntry();render();notify(`Entrada registrada: ${plate} · ${spot}`);
  }
  const money = value => Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  let pendingPaymentVehicleId=null;
  function calculateBill(vehicle){
    const elapsedMs=Math.max(0,Date.now()-new Date(vehicle.entered).getTime());
    const totalHours=Math.max(1,Math.ceil(elapsedMs/3600000));
    const extraHours=Math.max(0,totalHours-1);
    const base=Number(state.baseFee??30),hourly=Number(state.hourlyFee??5);
    return {elapsedMs,totalHours,extraHours,base,hourly,amount:base+extraHours*hourly,durationLabel:totalHours===1?"Até 1 hora":`${totalHours} horas`};
  }
  function openPayment(id){
    const v=state.vehicles.find(x=>x.id===id);if(!v||!v.inside)return;
    pendingPaymentVehicleId=id;const bill=calculateBill(v);
    $("#paymentVehicle").innerHTML=`<div><span>VEÍCULO</span><b>${escapeHtml(v.model||"Veículo")} · ${escapeHtml(v.plate)}</b></div><div><span>VAGA</span><b>${escapeHtml(v.spot)}</b></div><div><span>ENTRADA</span><b>${dateTime(new Date(v.entered))}</b></div><div><span>PERMANÊNCIA</span><b>${bill.durationLabel}</b></div>`;
    $("#billBreakdown").innerHTML=`<div><span>Tarifa básica (primeira hora)</span><b>${money(bill.base)}</b></div><div><span>Adicional (${bill.extraHours} hora(s) × ${money(bill.hourly)})</span><b>${money(bill.extraHours*bill.hourly)}</b></div>`;
    $("#paymentTotal").textContent=money(bill.amount);
    $("#pixCode").textContent=`PARKCORP-PIX-DEMO-${v.plate}-${Math.round(bill.amount*100)}`;
    $('input[name="paymentMethod"][value="debit"]').checked=true;
    updatePaymentMethod();$("#paymentModal").classList.remove("hidden");
  }
  function closePayment(){pendingPaymentVehicleId=null;$("#paymentModal").classList.add("hidden");}
  function updatePaymentMethod(){
    const method=$('input[name="paymentMethod"]:checked')?.value||"debit";
    $("#pixDemo").classList.toggle("hidden",method!=="pix");
    $("#paymentNote").textContent=method==="pix"?"PIX em modo demonstrativo. Para receber de verdade, conecte uma instituição ou gateway de pagamento.":"Modo local de demonstração: confirmar registra o pagamento no histórico, mas não faz uma cobrança bancária real.";
    $("#confirmPayment").textContent=method==="pix"?"Confirmar PIX (demonstração)":"Confirmar pagamento";
  }
  function confirmPayment(event){
    event.preventDefault();const v=state.vehicles.find(x=>x.id===pendingPaymentVehicleId);if(!v||!v.inside){closePayment();return;}
    const bill=calculateBill(v),method=$('input[name="paymentMethod"]:checked')?.value||"debit",paidAt=new Date().toISOString();
    state.payments=state.payments||[];state.payments.push({id:`pay-${Date.now()}`,vehicleId:v.id,plate:v.plate,spot:v.spot,method,amount:bill.amount,durationLabel:bill.durationLabel,paidAt,status:"registered_demo"});
    v.inside=false;v.exited=paidAt;v.paymentStatus="registered_demo";v.paymentMethod=method;v.amountPaid=bill.amount;addActivity("exit",v);save();closePayment();render();
    const label=({debit:"débito",credit:"crédito",pix:"PIX (demonstração)"})[method];notify(`Pagamento de ${money(bill.amount)} registrado via ${label}. Saída liberada.`);
  }
  function registerExit(id){openPayment(id);}
  function simulateArrival(){
    const free=allSpots().filter(s=>spotStatus(s)==="available");if(!free.length){notify("Estacionamento lotado: nenhuma vaga livre.","error");return;}
    const examples=[["QWE1A23","Renault Kwid","Branco"],["RTY2B34","Toyota Yaris","Prata"],["UIO3C45","Honda Fit","Cinza"],["ASD4D56","VW Polo","Preto"]];
    const data=examples[Math.floor(Math.random()*examples.length)];
    let plate=data[0];let suffix=1;while(state.vehicles.some(v=>v.inside&&v.plate===plate)){plate=data[0].slice(0,6)+String(suffix++);}
    const vehicle={id:`sim-${Date.now()}`,plate,model:data[1],color:data[2],spot:free[0],inside:true,entered:new Date().toISOString(),exited:null};
    state.vehicles.push(vehicle);state.createdToday=(state.createdToday||0)+1;addActivity("entry",vehicle);save();render();notify(`Veículo simulado: ${plate} direcionado à vaga ${vehicle.spot}`);
  }
  function runPlateDemo(){
    const plate=["FTR8G21","LKM4H90","ZXC2J11"][Math.floor(Math.random()*3)];
    const result=$("#recognitionResult");result.classList.remove("hidden");result.innerHTML=`<b>✓ Placa identificada: ${plate}</b><br><span style="color:#718477">Confiança simulada: 98,4% · Câmera de entrada · ${time(now())}</span>`;
  }
  function kioskLookup(){
    const plate=$("#kioskPlate").value.replace(/[^a-z0-9]/gi,"").toUpperCase(),msg=$("#kioskMessage");
    if(plate.length!==7){msg.textContent="Digite uma placa válida com 7 caracteres.";return;}
    const v=state.vehicles.find(x=>x.plate===plate&&x.inside);
    msg.textContent=v?`Veículo localizado · Vaga ${v.spot} · Entrada ${time(new Date(v.entered))}`:"Nenhum veículo ativo encontrado para esta placa.";
  }
  function exportCsv(){
    const header=["Data","Horario","Placa","Evento","Vaga"];
    const rows=state.activities.map(a=>{const d=new Date(a.at);return [d.toLocaleDateString("pt-BR"),time(d),a.plate,a.type==="entry"?"Entrada":"Saída",a.spot||""];});
    const csv=[header,...rows].map(row=>row.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="parkcorp-relatorio.csv";a.click();URL.revokeObjectURL(url);notify("Relatório CSV exportado.");
  }
  function saveSettings(){
    const name=$("#garageName").value.trim()||"ParkCorp",capacity=Math.max(1,Math.min(200,Number($("#garageCapacity").value)||24));
    if(capacity<occupiedSpots().size){notify("A capacidade não pode ser menor que as vagas ocupadas.","error");return;}
    const baseFee=Number($("#baseFee").value),hourlyFee=Number($("#hourlyFee").value);
    if(!Number.isFinite(baseFee)||baseFee<0||!Number.isFinite(hourlyFee)||hourlyFee<0){notify("Informe tarifas válidas (zero ou maior).","error");return;}
    state.garageName=name;state.capacity=capacity;state.unit=$("#garageUnit").value.trim()||"Unidade Matriz";state.baseFee=baseFee;state.hourlyFee=hourlyFee;state.notifications=$("#notifications").checked;save();render();notify("Configurações e tarifas salvas.");
  }
  function resetData(){
    if(!confirm("Restaurar os dados iniciais? As alterações locais serão perdidas."))return;
    state=seedData();save();render();notify("Dados de demonstração restaurados.");
  }
  function init(){
    $$(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
    $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
    ["#newEntryBtn","#quickEntry","#parkingEntryBtn","#vehiclesEntryBtn"].forEach(s=>$(s)?.addEventListener("click",()=>openEntry()));
    $("#simulateBtn").addEventListener("click",simulateArrival);
    $("#entryForm").addEventListener("submit",registerEntry);
    ["#closeModal","#cancelEntry"].forEach(s=>$(s).addEventListener("click",closeEntry));
    $("#entryModal").addEventListener("click",e=>{if(e.target.id==="entryModal")closeEntry();});
    $("#paymentForm").addEventListener("submit",confirmPayment);
    ["#closePayment","#cancelPayment"].forEach(sel=>$(sel).addEventListener("click",closePayment));
    $("#paymentModal").addEventListener("click",e=>{if(e.target.id==="paymentModal")closePayment();});
    $$('input[name="paymentMethod"]').forEach(r=>r.addEventListener("change",updatePaymentMethod));
    $("#copyPix").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#pixCode").textContent);notify("Código demonstrativo copiado.");}catch(e){notify("Não foi possível copiar automaticamente.","error");}});
    $("#vehicleSearch").addEventListener("input",renderVehicles);$("#vehicleStatus").addEventListener("change",renderVehicles);
    $("#spotFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;spotFilter=b.dataset.filter;$$(".filter-chip").forEach(x=>x.classList.toggle("selected",x===b));renderSpots();});
    $("#plateDemoBtn").addEventListener("click",runPlateDemo);
    $("#kioskSearch").addEventListener("click",kioskLookup);$("#kioskPlate").addEventListener("keydown",e=>{if(e.key==="Enter")kioskLookup();});
    $("#kioskPlate").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));
    $("#exportCsv").addEventListener("click",exportCsv);$("#saveSettings").addEventListener("click",saveSettings);$("#resetData").addEventListener("click",resetData);
    $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeEntry();closePayment();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openEntry();}});
    render();
  }
  document.addEventListener("DOMContentLoaded",init);
})();