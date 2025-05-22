// 메인 페이지 JavaScript
let salesChart = null;
let productChart = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    updateCurrentDate();

    // 로그인 폼 처리
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 로그인 상태 확인
    checkLoginStatus();
});

// 현재 날짜 표시
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        dateElement.textContent = now.toLocaleDateString('ko-KR', options);
    }
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === '1234') {
        // 로그인 성공
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').classList.add('active');

        // 세션 저장
        sessionStorage.setItem('isLoggedIn', 'true');

        // 대시보드 초기화
        initializeDashboard();

        Utils.showAlert('로그인되었습니다.', 'success');
    } else {
        Utils.showAlert('잘못된 로그인 정보입니다.', 'danger');
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').classList.add('active');
        initializeDashboard();
    }
}

// 로그아웃
function logout() {
    if (Utils.confirm('로그아웃하시겠습니까?')) {
        sessionStorage.removeItem('isLoggedIn');
        document.getElementById('login-screen').style.display = 'block';
        document.getElementById('main-system').classList.remove('active');

        // 차트 제거
        if (salesChart) {
            salesChart.destroy();
            salesChart = null;
        }
        if (productChart) {
            productChart.destroy();
            productChart = null;
        }

        Utils.showAlert('로그아웃되었습니다.', 'info');
    }
}

// 대시보드 초기화
function initializeDashboard() {
    updateKPICards();
    initializeCharts();
    loadRecentOrders();
    loadStockAlerts();

    // 차트 유형 변경 이벤트
    const chartTypeRadios = document.querySelectorAll('input[name="period"]');
    chartTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateSalesChart);
    });
}

// KPI 카드 업데이트
function updateKPICards() {
    const stats = DataManager.getStats();

    // 오늘 매출 (시뮬레이션)
    const todaySales = Math.floor(Math.random() * 500000) + 500000;
    document.querySelector('.stat-card.sales h3').textContent = Utils.formatCurrency(todaySales);

    // 오늘 주문
    const todayOrders = Math.floor(Math.random() * 50) + 100;
    document.querySelector('.stat-card.orders h3').textContent = todayOrders;

    // 전체 상품
    document.querySelector('.stat-card.inventory h3').textContent = stats.totalProducts;

    // 재고 알림
    document.querySelector('.stat-card.alerts h3').textContent = stats.lowStockCount;

    // 추가 정보 업데이트
    const lowStockText = stats.lowStockCount > 0 ? `${stats.lowStockCount}개 부족` : '모든 상품 충분';
    document.querySelector('.stat-card.inventory small').textContent = lowStockText;
}

// 차트 초기화
function initializeCharts() {
    initializeSalesChart();
    initializeProductChart();
}

// 매출 차트 초기화
function initializeSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // 기존 차트 제거
    if (salesChart) {
        salesChart.destroy();
    }

    // 주간 데이터 생성
    const weekData = generateWeeklyData();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekData.labels,
            datasets: [{
                label: '일별 매출 (원)',
                data: weekData.data,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return Utils.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3
                }
            }
        }
    });
}

// 상품별 판매량 차트 초기화
function initializeProductChart() {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;

    // 기존 차트 제거
    if (productChart) {
        productChart.destroy();
    }

    const categoryStats = DataManager.getCategoryStats();
    const categories = Object.keys(categoryStats);
    const data = categories.map(cat => categoryStats[cat].count);

    productChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#17a2b8',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6f42c1'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}개 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 매출 차트 업데이트
function updateSalesChart() {
    const selectedPeriod = document.querySelector('input[name="period"]:checked').id;

    let data;
    if (selectedPeriod === 'week') {
        data = generateWeeklyData();
    } else {
        data = generateMonthlyData();
    }

    salesChart.data.labels = data.labels;
    salesChart.data.datasets[0].data = data.data;
    salesChart.update();
}

// 주간 데이터 생성
function generateWeeklyData() {
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    const baseValues = [620000, 750000, 680000, 890000, 720000, 950000, 847000];
    const data = baseValues.map(base => base + (Math.random() - 0.5) * 100000);

    return { labels, data };
}

// 월간 데이터 생성
function generateMonthlyData() {
    const labels = [];
    const data = [];

    // 최근 30일 데이터 생성
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.getDate() + '일');

        // 주말에는 매출이 더 높도록 시뮬레이션
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseValue = isWeekend ? 900000 : 700000;
        data.push(baseValue + (Math.random() - 0.5) * 200000);
    }

    return { labels, data };
}

// 최근 주문 로드
function loadRecentOrders() {
    const tbody = document.getElementById('recent-orders');
    if (!tbody) return;

    const recentOrders = DataManager.getAllOrders().slice(0, 5);
    tbody.innerHTML = '';

    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        const time = new Date(order.time).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        row.innerHTML = `
            <td>${time}</td>
            <td>${order.product}</td>
            <td>${Utils.formatCurrency(order.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

// 재고 알림 로드
function loadStockAlerts() {
    const container = document.getElementById('stock-alerts');
    if (!container) return;

    const stats = DataManager.getStats();
    const lowStockProducts = stats.lowStockProducts;

    container.innerHTML = '';

    if (lowStockProducts.length === 0) {
        container.innerHTML = '<div class="alert alert-success">모든 상품의 재고가 충분합니다.</div>';
        return;
    }

    lowStockProducts.forEach(product => {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning d-flex justify-content-between align-items-center';
        alert.innerHTML = `
            <div>
                <strong>${product.name}</strong><br>
                <small>현재 재고: ${product.stock}개 / 최소 재고: ${product.minStock}개</small>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary" onclick="quickStockReplenish(${product.id})">
                    보충
                </button>
            </div>
        `;
        container.appendChild(alert);
    });
}

// 빠른 재고 보충
function quickStockReplenish(productId) {
    const product = DataManager.getProductById(productId);
    if (!product) return;

    const quantity = prompt(`${product.name}의 보충할 수량을 입력하세요:`, product.minStock * 2);
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        DataManager.addStock(productId, parseInt(quantity), '', '빠른 보충');
        Utils.showAlert(`${product.name} ${quantity}개가 입고되었습니다.`, 'success');

        // 화면 업데이트
        updateKPICards();
        loadStockAlerts();
    }
}

// 실시간 데이터 업데이트 (5분마다)
setInterval(function () {
    if (document.getElementById('main-system').classList.contains('active')) {
        updateKPICards();
        loadRecentOrders();
        loadStockAlerts();
    }
}, 300000); // 5분

// 페이지 가시성 변경 시 데이터 업데이트
document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.getElementById('main-system').classList.contains('active')) {
        updateKPICards();
        loadRecentOrders();
        loadStockAlerts();
    }
});

// 키보드 단축키
document.addEventListener('keydown', function (e) {
    // Ctrl+R: 데이터 새로고침
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (document.getElementById('main-system').classList.contains('active')) {
            updateKPICards();
            loadRecentOrders();
            loadStockAlerts();
            Utils.showAlert('데이터를 새로고침했습니다.', 'info');
        }
    }

    // Ctrl+L: 로그아웃
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
});

// 차트 리사이즈 핸들러
window.addEventListener('resize', function () {
    if (salesChart) {
        salesChart.resize();
    }
    if (productChart) {
        productChart.resize();
    }
});

// 에러 처리
window.addEventListener('error', function (e) {
    console.error('에러 발생:', e.error);
    Utils.showAlert('오류가 발생했습니다. 페이지를 새로고침해주세요.', 'danger');
});

// 페이지 언로드 시 차트 정리
window.addEventListener('beforeunload', function () {
    if (salesChart) {
        salesChart.destroy();
    }
    if (productChart) {
        productChart.destroy();
    }
});