let currentUser = '';
let currentPass = '';
let dbUrl = '';

// โหลดข้อมูลจาก config มาแสดงเมื่อเปิดหน้าเว็บ
window.onload = function() { 
    document.getElementById('ui-title').innerHTML = APP_CONFIG.TITLE_MAIN;
    document.getElementById('ui-subtitle').innerHTML = APP_CONFIG.SUB_TITLE;
    document.getElementById('ui-school').innerHTML = APP_CONFIG.SCHOOL_NAME;
    document.getElementById('ui-area').innerHTML = APP_CONFIG.AREA_NAME;
    document.getElementById('ui-fb').href = APP_CONFIG.FACEBOOK_URL;
    document.getElementById('ui-footer').innerHTML = APP_CONFIG.FOOTER_TEXT;
    
    fetchAnnouncement(); 
};

// จัดการ Event ทั่วไป
document.getElementById('searchForm').addEventListener('submit', handleSearch);
document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
document.getElementById('btnAdminFloat').addEventListener('click', showAdminLogin);
document.getElementById('btnBack').addEventListener('click', showSearch);
document.getElementById('btnSaveAnnounce').addEventListener('click', saveAnnouncement);
document.getElementById('btnOpenDB').addEventListener('click', openDatabase);
document.getElementById('btnLogoutAdmin').addEventListener('click', logoutAdmin);
document.getElementById('btnLogoutUser').addEventListener('click', logout);

async function callAPI(payload) {
    try {
        const response = await fetch(APP_CONFIG.API_URL, {
            method: 'POST',
            redirect: "follow",
            headers: { 'Content-Type': 'text/plain;charset=utf-8'},
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: "เชื่อมต่อฐานข้อมูลล้มเหลว: " + error.message };
    }
}

async function fetchAnnouncement() {
    try {
        const res = await fetch(APP_CONFIG.API_URL + "?action=getAnnouncement");
        const data = await res.json();
        if (data.text && data.text.trim() !== "") {
            document.getElementById('publicAnnouncementBox').style.display = 'block';
            document.getElementById('publicAnnouncementText').innerText = data.text;
            document.getElementById('adminAnnounceText').value = data.text;
        } else {
            document.getElementById('publicAnnouncementBox').style.display = 'none';
        }
    } catch (error) { console.error("Fetch announcement error", error); }
}

function showSearch() {
    document.getElementById('searchSection').style.display = 'flex';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('studentIdInput').value = '';
    document.getElementById('smallLogo').style.display = 'none';
    document.getElementById('obecLogo').style.display = 'none';
    document.getElementById('btnAdminFloat').style.display = 'block';
}

function showAdminLogin() {
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
    document.getElementById('adminControlPanel').style.display = 'none';
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('btnAdminFloat').style.display = 'none';
}

function showDashboard() {
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'flex';
    document.getElementById('smallLogo').style.display = 'block';
    document.getElementById('obecLogo').style.display = 'block';
    document.getElementById('btnAdminFloat').style.display = 'none';
}

async function handleAdminLogin(e) {
    e.preventDefault();
    currentUser = document.getElementById('adminUser').value;
    currentPass = document.getElementById('adminPass').value;
    Swal.fire({ title: 'กำลังตรวจสอบสิทธิ์... 🕵️‍♂️', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    const res = await callAPI({ action: "checkAdmin", user: currentUser, pass: currentPass });

    if (res.success) {
        dbUrl = res.url;
        Swal.close();
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminControlPanel').style.display = 'block';
        fetchAnnouncement();
    } else {
        Swal.fire({ icon: 'error', title: '❌ เข้าสู่ระบบล้มเหลว', text: res.message });
    }
}

async function saveAnnouncement() {
    const text = document.getElementById('adminAnnounceText').value;
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    const res = await callAPI({ action: "saveAnnouncement", text: text, user: currentUser, pass: currentPass });

    if (res.success) {
        Swal.fire({ icon: 'success', title: '✅ บันทึกสำเร็จ!', text: 'อัปเดตประกาศเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
        fetchAnnouncement();
    } else {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: res.message });
    }
}

function openDatabase() { if (dbUrl) window.open(dbUrl, '_blank'); }

function logoutAdmin() { currentUser = ''; currentPass = ''; dbUrl = ''; showSearch(); }

async function handleSearch(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentIdInput').value;

    Swal.fire({
        title: 'กำลังค้นหาข้อมูล... 🚀',
        html: '<b>ระบบกำลังค้นหาข้อมูลให้ครับ</b><br>กรุณารอสักครู่...',
        allowOutsideClick: false,
        background: '#fff',
        backdrop: `rgba(0,34,68,0.4)`,
        didOpen: () => { Swal.showLoading(); }
    });

    const response = await callAPI({ action: "search", studentId: studentId });

    if (response.success) {
        Swal.fire({ icon: 'success', title: '🎉 ค้นหาสำเร็จ!', text: 'เตรียมข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
        renderDashboard(response.data, response.headers);
        showDashboard();
    } else {
        Swal.fire({ icon: 'error', title: '❌ อ๊ะ! ไม่พบข้อมูล', text: response.message, confirmButtonColor: '#002244' });
    }
}

function renderDashboard(data, headers) {
    let infoHtml = ''; let cardsHtml = ''; let summaryHtml = '';
    let totalScoreCardHtml = ''; let resultCardHtml = '';
    const infoFields = ['ระดับชั้น/โครงการ', 'รหัสประจำตัวประชาชน', 'รหัส', 'ชื่อ-สกุล'];

    infoFields.forEach(field => {
        if (data[field] !== undefined) {
            infoHtml += `<div class="mb-2"><span class="text-secondary fw-bold" style="color:#6c757d !important;">${field}:</span> <strong style="color: var(--primary-color);" class="fs-4 ms-2">${data[field]}</strong></div>`;
        }
    });

    headers.forEach(key => {
        if (!infoFields.includes(key) && data[key] !== undefined) {
            let scoreValue = data[key] === "" ? "-" : data[key];
            if (key.includes("รวม")) {
                totalScoreCardHtml = `<div class="score-card total-score"><div class="score-title">🏆 ${key}</div><div class="score-value">${scoreValue}</div></div>`;
            } else if (key === "ผลการสอบ") {
                resultCardHtml = `<div class="score-card result-score"><div class="score-title">📌 ${key}</div><div class="score-value">${scoreValue}</div></div>`;
            } else {
                let icon = '📝';
                if (key.includes("วิทย์")) icon = '🔬';
                if (key.includes("คณิต")) icon = '🔢';
                if (key.includes("อังกฤษ")) icon = '🔤';
                if (key.includes("สัมภาษณ์")) icon = '🎤';
                cardsHtml += `<div class="score-card"><div class="score-title">${icon} ${key}</div><div class="score-value">${scoreValue}</div></div>`;
            }
        }
    });

    if (totalScoreCardHtml || resultCardHtml) summaryHtml = totalScoreCardHtml + resultCardHtml;
    document.getElementById('studentInfo').innerHTML = infoHtml;
    document.getElementById('scoreGridContainer').innerHTML = cardsHtml;
    document.getElementById('summaryGridContainer').innerHTML = summaryHtml;
}

function logout() {
    Swal.fire({
        title: 'ต้องการปิดหน้าต่าง? 🚪', text: "ข้อมูลของคุณจะถูกล้างเพื่อความปลอดภัย", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#002244',
        confirmButtonText: 'ปิดหน้าต่าง', cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('studentInfo').innerHTML = '';
            document.getElementById('scoreGridContainer').innerHTML = '';
            document.getElementById('summaryGridContainer').innerHTML = '';
            showSearch();
        }
    })
}
