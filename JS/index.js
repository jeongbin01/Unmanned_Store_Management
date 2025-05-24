// 대시보드 메인 JavaScript

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 로그인 폼 이벤트 리스너
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 차트 초기화
    if (document.getElementById('salesChart')) {
        initSalesChart();
    }
    if (document.getElementById('productChart')) {
        initProductChart();
    }
    
    // 실시간 데이터 업데이트
    updateDashboardData();
    setInterval(updateDashboardData, 30000); // 30초마다 업데이트
});

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 간단한 로그인 검증 (실제 환경에서는 보안이 강화되어야 함)
    if (username === 'admin' && password === '1234') {
        // 로그인 성공
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        
        // 로그인 상태 저장 (메모리에)
        window.isLoggedIn = true;
        
        // 환영 메시지
        showNotification('로그인 성공!', 'success');
    } else {
        showNotification('아이디 또는 비밀번호가 잘못되었습니다.', 'error');
    }
}

// 로그아웃 처리
function logout() {
    window.isLoggedIn = false;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-system').style.display = 'none';
    
    // 폼 초기화
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = '1234';
    
    showNotification('로그아웃되었습니다.', 'info');
}

// 로그인 상태 확인
function checkLoginStatus() {
    if (window.isLoggedIn) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-system').style.display = 'none';
    }
}

// 매출 차트 초기화
function initSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['월', '화', '수', '목', '금', '토', '일'],
            datasets: [{
                label: '일별 매출 (원)',
                data: [520000, 680000, 750000, 620000, 890000, 920000, 847000],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + '원';
                        }
                    }
                }
            }
        }
    });
}

// 상품별 판매량 차트 초기화
function initProductChart() {
    const ctx = document.getElementById('productChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['콜라', '사이다', '초코파이', '라면', '기타'],
            datasets: [{
                data: [25, 20, 15, 12, 28],
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6c757d'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 대시보드 데이터 업데이트
function updateDashboardData() {
    // 실제 환경에서는 API 호출로 실시간 데이터를 가져옴
    const salesData = generateRandomSalesData();
    
    // KPI 카드 업데이트
    updateKPICards(salesData);
}

// 랜덤 매출 데이터 생성 (시뮬레이션용)
function generateRandomSalesData() {
    return {
        todaySales: Math.floor(Math.random() * 200000) + 700000,
        todayOrders: Math.floor(Math.random() * 50) + 100,
        totalProducts: 245,
        lowStockAlerts: Math.floor(Math.random() * 3) + 3
    };
}

// KPI 카드 업데이트
function updateKPICards(data) {
    // 매출 업데이트
    const salesElement = document.querySelector('.stat-card.sales h3');
    if (salesElement) {
        salesElement.textContent = data.todaySales.toLocaleString() + '원';
    }
    
    // 주문 수 업데이트
    const ordersElement = document.querySelector('.stat-card.orders h3');
    if (ordersElement) {
        ordersElement.textContent = data.todayOrders.toString();
    }
    
    // 재고 알림 업데이트
    const alertsElement = document.querySelector('.stat-card.alerts h3');
    if (alertsElement) {
        alertsElement.textContent = data.lowStockAlerts.toString();
    }
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // 새 알림 생성
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'danger' : type} custom-alert`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(alert);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 3000);
}

// 페이지 네비게이션
function navigateTo(page) {
    window.location.href = page;
}

document.head.appendChild(style);