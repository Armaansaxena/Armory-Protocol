document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("manual-addr");
  const resultDiv = document.getElementById("result");

  input.addEventListener("input", async (e) => {
    const addr = e.target.value.trim();
    if (addr.length >= 32) {
      resultDiv.className = "result-area";
      resultDiv.textContent = "Checking...";
      resultDiv.style.display = "block";

      try {
        const result = await armoryQueryByAddress(addr);
        if (result.status === "Verified") {
          resultDiv.className = "result-area v";
          resultDiv.innerHTML = `✅ <strong>${result.entityName}</strong><br>${result.domain}`;
        } else {
          resultDiv.className = "result-area u";
          resultDiv.textContent = "⚠️ UNVERIFIED ADDRESS";
        }
      } catch (err) {
        resultDiv.textContent = "Error checking registry.";
      }
    } else {
      resultDiv.style.display = "none";
    }
  });

  // Update launch app URL based on storage
  chrome.storage.local.get(["appUrl"], (result) => {
    const appUrl = result.appUrl || "http://localhost:3000";
    document.getElementById("launch-app").href = appUrl;
  });
});
