document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Navigation Logic (Single Page Application) ---
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            // Hide all sections
            viewSections.forEach(section => section.classList.remove('active-view'));
            
            // Add active class to clicked tab
            item.classList.add('active');
            
            // Show the target section with animation
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

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- 3. Generator Logic ---
    const generateBtn = document.getElementById('generate-btn');
    const snippetBox = document.getElementById('snippet-box');
    const generatedCodeText = document.getElementById('generated-code');
    const copyBtn = document.getElementById('copy-btn');

    generateBtn.addEventListener('click', () => {
        const uniqueToken = 'HT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const snippetCode = `
<!-- ShadowTrap Adaptive Honeytoken -->
<script>
    (function(){
        const trapId = "${uniqueToken}";
        const shadowTrapApi = "http://localhost:5000/api/alert";
        
        window.addEventListener('contextmenu', (e) => {
            console.warn("ShadowTrap: Suspicious activity detected.");
            // Payload triggers POST request securely
            fetch(shadowTrapApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trap_id: trapId })
            }).catch(err => console.error(err));
        });
    })();
</script>`.trim();

        // Display code with animation
        generatedCodeText.textContent = snippetCode;
        snippetBox.style.display = 'block';
        snippetBox.style.animation = 'fadeIn 0.5s ease-in-out';
        
        // Show English notification
        showToast('Payload generated successfully!', 'success');
    });

    // --- 4. Copy Logic ---
    copyBtn.addEventListener('click', () => {
        const textToCopy = generatedCodeText.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Code copied to clipboard!', 'success');
        });
    });
});