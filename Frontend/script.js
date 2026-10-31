document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Navigation Logic (Single Page Application) ---
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // إزالة التفعيل من كل الأزرار والصفحات
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => section.classList.remove('active-view'));
            
            // تفعيل الزر والصفحة المطلوبة
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-view');
            }
        });
    });

    // --- 2. Toast Notification System ---
    function showToast(message, type = 'default') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '<i class="fa-solid fa-circle-info"></i>';
        if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- 3. Generator Logic (Secure with API Key) ---
    const generateBtn = document.getElementById('generate-btn');
    const snippetBox = document.getElementById('snippet-box');
    const generatedCodeText = document.getElementById('generated-code');
    const copyBtn = document.getElementById('copy-btn');

    generateBtn.addEventListener('click', () => {
        // توليد معرّف فريد للفخ
        const uniqueToken = 'HT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // الكود المحدث ليحتوي على مفتاح العميل (API Key)
        const snippetCode = `
<!-- ShadowTrap Adaptive Honeytoken -->
<script>
    (function(){
        const trapId = "${uniqueToken}";
        const clientApiKey = "ST-DEMO-KEY-2026"; // المفتاح السري للعميل
        const shadowTrapApi = "http://localhost:5000/api/alert";
        
        // مراقبة سلوك المهاجم
        window.addEventListener('contextmenu', (e) => {
            console.warn("ShadowTrap: Suspicious activity detected.");
            // إرسال التنبيه والمفتاح السري للسيرفر
            fetch(shadowTrapApi, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': clientApiKey
                },
                body: JSON.stringify({ trap_id: trapId })
            }).catch(err => console.error(err));
        });
    })();
</script>`.trim();

        // عرض الكود في الشاشة
        generatedCodeText.textContent = snippetCode;
        snippetBox.style.display = 'block';
        snippetBox.style.animation = 'fadeIn 0.5s ease-in-out';
        
        showToast('Payload generated with secure API Key!', 'success');
    });

    // --- 4. Copy Logic ---
    copyBtn.addEventListener('click', () => {
        const textToCopy = generatedCodeText.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Code copied to clipboard!', 'success');
        });
    });

    // --- 5. Fetch Live Analytics & Build Charts ---
    const fetchAnalytics = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/logs');
            const data = await response.json();
            
            // تحديث عداد الهجمات في لوحة القيادة
            const dailyAttacksEl = document.getElementById('daily-attacks');
            if (dailyAttacksEl) dailyAttacksEl.innerText = data.length;

            // تحديث جدول السجلات الأمنية
            const logsBody = document.getElementById('logs-body');
            if (logsBody) logsBody.innerHTML = ''; 
            
            const countryCounts = {}; 

            data.forEach(log => {
                // تجميع بيانات الدول للرسم البياني
                countryCounts[log.country] = (countryCounts[log.country] || 0) + 1;

                // بناء صف الجدول
                const row = document.createElement('tr');
                const dateObj = new Date(log.timestamp);
                const timeStr = dateObj.toLocaleTimeString() + ' ' + dateObj.toLocaleDateString();
                
                row.innerHTML = `
                    <td>${timeStr}</td>
                    <td><span class="badge" style="background:#334155;">${log.trap_id}</span></td>
                    <td>${log.attacker_ip} <br><small style="color:var(--text-muted);">${log.country} - ${log.city}</small></td>
                    <td><span class="badge high">Critical</span></td>
                    <td><button style="background:transparent; border:none; color:var(--primary); cursor:pointer;"><i class="fa-solid fa-shield"></i> Block IP</button></td>
                `;
                if (logsBody) logsBody.appendChild(row);
            });

            // تحديث الرسم البياني
            updateChart(countryCounts);

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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
            }
        });
    };

    // جلب البيانات فوراً ثم تحديثها كل 5 ثوانٍ
    fetchAnalytics();
    setInterval(fetchAnalytics, 5000);
});