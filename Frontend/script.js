document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // --- 1. Navigation Logic (التنقل بين الصفحات) ---
    // =========================================================
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => section.classList.remove('active-view'));
            
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-view');
            }
        });
    });

    // =========================================================
    // --- 2. Toast Notification System (نظام الإشعارات) ---
    // =========================================================
    function showToast(message, type = 'default') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '<i class="fa-solid fa-circle-info"></i>';
        if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === 'danger') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
    // جعل دالة الإشعارات عامة حتى تعمل مع أزرار صفحة الإعدادات
    window.showToast = showToast;

    // =========================================================
    // --- 3. Generator Logic (توليد الفخاخ الجديدة) ---
    // =========================================================
    const generateBtn = document.getElementById('generate-btn');
    const snippetBox = document.getElementById('snippet-box');
    const generatedCodeText = document.getElementById('generated-code');
    const copyBtn = document.getElementById('copy-btn');

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const uniqueToken = 'HT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            const snippetCode = `
<!-- ShadowTrap Adaptive Honeytoken (V2.0) -->
<script>
    (function(){
        const targetSite = "New Client Node";
        const honeytokenType = "Generated Trap (${uniqueToken})";
        const clientApiKey = "ST-DEMO-KEY-2026"; 
        const shadowTrapApi = "http://127.0.0.1:5000/api/alert";
        
        window.addEventListener('contextmenu', (e) => {
            console.warn("ShadowTrap: Suspicious activity detected.");
            fetch(shadowTrapApi, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': clientApiKey
                },
                body: JSON.stringify({ target_site: targetSite, honeytoken_type: honeytokenType })
            }).catch(err => console.error(err));
        });
    })();
</script>`.trim();

            generatedCodeText.textContent = snippetCode;
            snippetBox.style.display = 'block';
            snippetBox.style.animation = 'fadeIn 0.5s ease-in-out';
            
            showToast('V2.0 Payload generated securely!', 'success');
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = generatedCodeText.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('Code copied to clipboard!', 'success');
            });
        });
    }

    // =========================================================
    // --- 4. Fetch Live Analytics & Terminal (جلب البيانات) ---
    // =========================================================
    let previousAttackCount = 0; 

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/logs');
            const data = await response.json();
            
            // 🚨 استفزاز السيرفر عند هجوم جديد
            if (data.length > previousAttackCount) {
                if (previousAttackCount > 0 && window.triggerServerSpike) { 
                    window.triggerServerSpike();
                    showToast('CRITICAL: New Threat Intercepted!', 'danger');
                }
                previousAttackCount = data.length;
            }

            // تحديث العدادات
            const dailyAttacksEl = document.getElementById('daily-attacks');
            if (dailyAttacksEl) dailyAttacksEl.innerText = data.length;

            const logsBody = document.getElementById('logs-body');
            if (logsBody) logsBody.innerHTML = ''; 
            
            // تجهيز التيرمنال
            const terminalEl = document.getElementById('terminal-output');
            let termHtml = `<span style="color: #fff;">[ root@shadowtrap ]#</span> Connected to SQLite DB.<br>
                            <span style="color: #fff;">[ root@shadowtrap ]#</span> Tailing /var/log/shadowtrap.log...<br>
                            <span style="color: var(--text-muted);">---------------------------------------------------</span><br>`;

            const countryCounts = {}; 

            data.forEach(log => {
                countryCounts['Local/Unknown'] = (countryCounts['Local/Unknown'] || 0) + 1;
                
                // إضافة السطر للجدول (الداشبورد)
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${log.timestamp}</td>
                    <td style="color: var(--neon-green); font-weight: bold;">${log.target_site}</td>
                    <td style="color: var(--neon-red); font-family: var(--font-code);">${log.honeytoken_type}</td>
                    <td>${log.hacker_ip}</td>
                    <td>📍 <small style="color:var(--text-muted);">Unknown</small></td>
                    <td>
                        <button onclick="blockIpAction(this, '${log.hacker_ip}')" style="background:transparent; border:1px solid var(--neon-red); color:var(--neon-red); cursor:pointer; padding:5px 10px; border-radius:4px; font-weight:bold; transition:0.3s;">
                            <i class="fa-solid fa-shield"></i> BLOCK IP
                        </button>
                    </td>
                `;
                if (logsBody) logsBody.appendChild(row);

                // إضافة السطر لشاشة التيرمنال (الخام)
                termHtml += `[${log.timestamp}] <span style="color:var(--neon-red);">[CRITICAL]</span> Intrusion at ${log.target_site} (${log.honeytoken_type}) | SRC_IP: ${log.hacker_ip}<br>`;
            });

            // طباعة التيرمنال وتحديث الخريطة
            if (terminalEl) terminalEl.innerHTML = termHtml;
            if (typeof updateChart === "function") updateChart(countryCounts);

        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    // إعداد المخطط البياني (Chart.js)
    let geoChart;
    const updateChart = (countryData) => {
        const ctx = document.getElementById('geoChart');
        if (!ctx) return;
        
        const labels = Object.keys(countryData);
        const data = Object.values(countryData);

        if (geoChart) geoChart.destroy(); 

        geoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['No Data'],
                datasets: [{
                    label: 'Intrusion Attempts',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
            }
        });
    };

    // جلب البيانات كل ثانيتين (لأكشن أسرع بالمعرض)
    fetchAnalytics();
    setInterval(fetchAnalytics, 2000);

    // =========================================================
    // --- 5. حزمة الأكشن والتحكم الجنائي (CPU / RAM / CSV) ---
    // =========================================================

    // مقاييس السيرفر الوهمية (حركة طبيعية)
    setInterval(() => {
        let baseCpu = Math.floor(Math.random() * 10) + 5;
        let baseRam = (Math.random() * (2.5 - 1.8) + 1.8).toFixed(1);
        
        let cpuEl = document.getElementById('cpu-load');
        if(cpuEl && cpuEl.style.color !== 'var(--neon-red)') {
            cpuEl.innerText = baseCpu + '%';
            let ramEl = document.getElementById('ram-usage');
            if (ramEl) ramEl.innerText = baseRam + ' GB';
        }
    }, 3000);

    // دالة استفزاز السيرفر (Spike) عند حدوث اختراق
    window.triggerServerSpike = function() {
        let cpuEl = document.getElementById('cpu-load');
        if(cpuEl) {
            cpuEl.innerText = Math.floor(Math.random() * (99 - 85) + 85) + '%';
            cpuEl.style.color = 'var(--neon-red)'; 
            let ramEl = document.getElementById('ram-usage');
            if (ramEl) ramEl.innerText = '3.9 GB';
            
            setTimeout(() => {
                cpuEl.style.color = 'var(--neon-green)';
            }, 4000);
        }
    }

    // تصدير التقرير الجنائي (CSV) للمدراء
    const exportBtn = document.getElementById('export-btn');
    if(exportBtn) {
        exportBtn.addEventListener('click', () => {
            let csvContent = "data:text/csv;charset=utf-8,Time,Target Site,Honeytoken,Hacker IP,Severity\n";
            const rows = document.querySelectorAll('#logs-body tr');
            
            rows.forEach(row => {
                let cols = row.querySelectorAll('td');
                if(cols.length > 0) {
                    let rowData = [
                        cols[0].innerText, 
                        cols[1].innerText, 
                        cols[2].innerText, 
                        cols[3].innerText, 
                        "CRITICAL"         
                    ].join(",");
                    csvContent += rowData + "\n";
                }
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "ShadowTrap_Forensics_Report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Forensics Report Exported Successfully!', 'success');
        });
    }

    // زر حظر الـ IP (Active Mitigation)
    window.blockIpAction = function(buttonElement, ip) {
        buttonElement.innerHTML = '<i class="fa-solid fa-ban"></i> BLOCKED';
        buttonElement.style.background = 'var(--neon-red)';
        buttonElement.style.color = '#fff';
        buttonElement.disabled = true; 
        showToast(`Threat Neutralized! IP ${ip} blocked at firewall level.`, 'danger');
    }
});
