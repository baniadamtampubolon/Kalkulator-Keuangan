/**
 * SCRIPT PENGUJIAN OTOMATIS API GOOGLE APPS SCRIPT (GAS)
 * Jalankan dengan: node scripts/test_gas_api.mjs
 */

const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbyHhSy4j0a3W0doKZ5JB_579IqkC5Cqjux7nuemnlbWUnTnVCKWGqlpcLXCYhrB6DuXcQ/exec";

console.log("=================================================");
console.log("🚀 MEMULAI PENGUJIAN API GOOGLE APPS SCRIPT");
console.log(`📡 Target URL: ${GAS_URL}`);
console.log("=================================================\n");

async function runGetTest(actionName, description) {
  const start = Date.now();
  try {
    const url = `${GAS_URL}?action=${actionName}`;
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const duration = Date.now() - start;
    
    if (!res.ok) {
      console.log(`❌ [GET] ${actionName.padEnd(18)} : FAILED (HTTP ${res.status}) [${duration}ms] - ${description}`);
      return false;
    }
    
    const json = await res.json();
    if (json.status === "success") {
      const count = Array.isArray(json.data) ? json.data.length : Object.keys(json.data || {}).length;
      console.log(`✅ [GET] ${actionName.padEnd(18)} : SUCCESS (${count} data) [${duration}ms] - ${description}`);
      return true;
    } else {
      console.log(`⚠️ [GET] ${actionName.padEnd(18)} : ERROR (${json.message}) [${duration}ms]`);
      return false;
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`❌ [GET] ${actionName.padEnd(18)} : EXCEPTION (${err.message}) [${duration}ms]`);
    return false;
  }
}

async function main() {
  console.log("--- 1. PENGUJIAN AKSI GET (READ DATA) ---");
  await runGetTest("GET_MASTERS", "Tarik data Pegawai, SBM, dan Master Memo");
  await runGetTest("GET_KEGIATAN_LIST", "Tarik seluruh daftar kegiatan tersimpan");
  await runGetTest("GET_REKAP", "Tarik seluruh 48 kolom rekap perdin");
  await runGetTest("GET_PESERTA", "Tarik seluruh detail baris peserta");

  console.log("\n=================================================");
  console.log("🏁 PENGUJIAN API SELESAI");
  console.log("=================================================");
}

main();
