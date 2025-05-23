// 재고 관리 페이지 JavaScript
let inventoryChart = null;
let stockLevelChart = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    // 로그인 상태 확인
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    initializeInventoryPage();
});

// 페이지 초기화
function initializeInventoryPage() {
    updateInventoryStats();
    initializeCharts();
    loadLowStockItems();
    loadQuickStockForm();
    loadInventoryTable();
    loadStockMovements();
    setupEventListeners();
}

// 재고 통계 업데이트
function updateInventoryStats() {
    const stats = DataManager.getStats();
    const products = DataManager.getAllProducts();

    // 총 재고 수량
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    document.getElementById('total-stock').textContent = Utils.formatNumber(totalStock);

    // 재고 부족 상품 수
    document.getElementById('low-stock-count').textContent = stats.lowStockCount;

    // 총 재고 가치
    document.getElementById('total-inventory-value').textContent = Utils.formatCurrency(stats.totalValue);

    // 평균 재고 회전율 (시뮬레이션)
    const turnoverRate = (2.0 + Math.random() * 1.0).toFixed(1);
    document.getElementById('turnover-rate').textContent = turnoverRate;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 차트 타입 변경
    const chartTypeRadios = document.querySelectorAll('input[name="chartType"]');
    chartTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateInventoryChart);
    });

    // 필터 변경
    const categoryFilter = document.getElementById('inventory-category-filter');
    const statusFilter = document.getElementById('inventory-status-filter');
    const movementFilter = document.getElementById('movement-type-filter');

    if (categoryFilter) categoryFilter.addEventListener('change', loadInventoryTable);
    if (statusFilter) statusFilter.addEventListener('change', loadInventoryTable);
    if (movementFilter) movementFilter.addEventListener('change', loadStockMovements);

    // 빠른 입고 폼
    const quickStockForm = document.getElementById('quick-stock-form');
    if (quickStockForm) {
        quickStockForm.addEventListener('submit', handleQuickStockIn);
    }
}

// 차트 초기화
function initializeCharts() {
    initializeInventoryChart();
    initializeStockLevelChart();
}

// 재고 현황 차트 초기화
function initializeInventoryChart() {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;

    // 기존 차트 제거
    if (inventoryChart) {
        inventoryChart.destroy();
    }

    const categoryStats = DataManager.getCategoryStats();
    const categories = Object.keys(categoryStats);
    const stockData = categories.map(cat => categoryStats[cat].stock);

    const chartType = document.querySelector('input[name="chartType"]:checked')?.id || 'bar';

    inventoryChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: categories,
            datasets: [{
                label: '재고 수량',
                data: stockData,
                backgroundColor: [
                    '#17a2b8',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6f42c1'
                ],
                borderColor: chartType === 'bar' ? [
                    '#138496',
                    '#1e7e34',
                    '#e0a800',
                    '#bd2130',
                    '#59359a'
                ] : '#fff',
                borderWidth: chartType === 'bar' ? 1 : 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: chartType === 'doughnut',
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            if (chartType === 'doughnut') {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value}개 (${percentage}%)`;
                            }
                            return `${label}: ${value}개`;
                        }
                    }
                }
            },
            scales: chartType === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + '개';
                        }
                    }
                }
            } : {}
        }
    });
}

// 재고 수준 분포 차트 초기화
function initializeStockLevelChart() {
    const ctx = document.getElementById('stockLevelChart');
    if (!ctx) return;

    // 기존 차트 제거
    if (stockLevelChart) {
        stockLevelChart.destroy();
    }

    const products = DataManager.getAllProducts();
    let lowStock = 0, mediumStock = 0, highStock = 0;

    products.forEach(product => {
        const status = Utils.getStockStatus(product.stock, product.minStock);
        if (status.level === 'danger') lowStock++;
        else if (status.level === 'warning') mediumStock++;
        else highStock++;
    });

    stockLevelChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['부족', '보통', '충분'],
            datasets: [{
                data: [lowStock, mediumStock, highStock],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
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

// 재고 현황 차트 업데이트
function updateInventoryChart() {
    initializeInventoryChart();
}

// 재고 부족 상품 로드
function loadLowStockItems() {
    const container = document.getElementById('low-stock-items');
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
                <small>현재: ${product.stock}개 / 최소: ${product.minStock}개</small>
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="quickReplenish(${product.id})">
                보충
            </button>
        `;
        container.appendChild(alert);
    });
}

// 빠른 입고 폼 설정
function loadQuickStockForm() {
    const select = document.getElementById('quick-product-select');
    if (!select) return;

    const products = DataManager.getAllProducts();
    select.innerHTML = '<option value="">상품 선택</option>';

    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (현재: ${product.stock}개)`;
        select.appendChild(option);
    });

    // 입고 등록 모달의 상품 선택도 업데이트
    const modalSelect = document.getElementById('stock-product-select');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">상품을 선택하세요</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (현재: ${product.stock}개)`;
            modalSelect.appendChild(option);
        });
    }
}

// 빠른 입고 처리
function handleQuickStockIn(e) {
    e.preventDefault();

    const productId = parseInt(document.getElementById('quick-product-select').value);
    const quantity = parseInt(document.getElementById('quick-quantity').value);

    if (!productId || !quantity || quantity <= 0) {
        Utils.showAlert('상품과 수량을 올바르게 입력해주세요.', 'danger');
        return;
    }

    const product = DataManager.addStock(productId, quantity, '', '빠른 입고');
    if (product) {
        Utils.showAlert(`${product.name} ${quantity}개가 입고되었습니다.`, 'success');

        // 폼 리셋
        document.getElementById('quick-stock-form').reset();

        // 화면 업데이트
        updateInventoryStats();
        loadLowStockItems();
        loadInventoryTable();
        loadRecentStockIn();
        updateCharts();
    }
}

// 빠른 보충
function quickReplenish(productId) {
    const product = DataManager.getProductById(productId);
    if (!product) return;

    const recommendedQuantity = Math.max(product.minStock * 2 - product.stock, 10);
    const quantity = prompt(`${product.name}의 보충할 수량을 입력하세요:`, recommendedQuantity);

    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const updatedProduct = DataManager.addStock(productId, parseInt(quantity), '', '재고 보충');
        if (updatedProduct) {
            Utils.showAlert(`${updatedProduct.name} ${quantity}개가 입고되었습니다.`, 'success');

            // 화면 업데이트
            updateInventoryStats();
            loadLowStockItems();
            loadInventoryTable();
            loadRecentStockIn();
            updateCharts();
        }
    }
}

// 재고 상세 테이블 로드
function loadInventoryTable() {
    const tbody = document.getElementById('inventory-table');
    if (!tbody) return;

    const category = document.getElementById('inventory-category-filter')?.value || '';
    const status = document.getElementById('inventory-status-filter')?.value || '';

    let products = DataManager.getAllProducts();

    // 카테고리 필터
    if (category) {
        products = products.filter(p => p.category === category);
    }

    // 상태 필터
    if (status) {
        products = products.filter(p => {
            const stockStatus = Utils.getStockStatus(p.stock, p.minStock);
            return stockStatus.level === status ||
                (status === 'low' && stockStatus.level === 'danger') ||
                (status === 'medium' && stockStatus.level === 'warning') ||
    // 상태 필터
    if (status) {
                products = products.filter(p => {
                    const stockStatus = Utils.getStockStatus(p.stock, p.minStock);
                    return stockStatus.level === status ||
                        (status === 'low' && stockStatus.level === 'danger') ||
                        (status === 'medium' && stockStatus.level === 'warning') ||
                        (status === 'high' && stockStatus.level === 'success');
                });
            }

            tbody.innerHTML = '';

            products.forEach(product => {
                const row = document.createElement('tr');
                const stockStatus = Utils.getStockStatus(product.stock, product.minStock);
                const inventoryValue = product.stock * product.price;

                row.innerHTML = `
            <td>
                <strong>${product.name}</strong>
                ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
            </td>
            <td><span class="badge bg-secondary">${product.category}</span></td>
            <td>
                <span class="badge ${stockStatus.level === 'danger' ? 'bg-danger' : stockStatus.level === 'warning' ? 'bg-warning' : 'bg-success'}">
                    ${product.stock}
                </span>
            </td>
            <td>${product.minStock}</td>
            <td>
                <span class="${stockStatus.class}">
                    ${stockStatus.text}
                    ${product.stock <= product.minStock ? '<i class="fas fa-exclamation-triangle ms-1"></i>' : ''}
                </span>
            </td>
            <td>${Utils.formatCurrency(product.price)}</td>
            <td>${Utils.formatCurrency(inventoryValue)}</td>
            <td>${Utils.formatDate(product.lastStockIn)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-success" onclick="showStockInModal(${product.id})" title="입고">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="showStockAdjustModal(${product.id})" title="조정">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
                tbody.appendChild(row);
            });
        }

// 재고 이동 내역 로드
function loadStockMovements() {
                const tbody = document.getElementById('stock-movement-table');
                if (!tbody) return;

                const typeFilter = document.getElementById('movement-type-filter')?.value || '';
                let movements = DataManager.getAllStockMovements();

                // 타입 필터
                if (typeFilter) {
                    movements = movements.filter(m => m.type === typeFilter);
                }

                tbody.innerHTML = '';

                movements.slice(0, 20).forEach(movement => {
                    const row = document.createElement('tr');
                    const typeText = Utils.getMovementTypeText(movement.type);
                    const typeClass = Utils.getMovementTypeClass(movement.type);

                    row.innerHTML = `
            <td>${Utils.formatDateTime(movement.date)}</td>
            <td>${movement.productName}</td>
            <td><span class="${typeClass}">${typeText}</span></td>
            <td>
                ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
            </td>
            <td>${movement.previousStock}</td>
            <td>${movement.currentStock}</td>
            <td>${movement.notes || '-'}</td>
        `;
                    tbody.appendChild(row);
                });
            }

// 최근 입고 내역 로드
function loadRecentStockIn() {
                const container = document.getElementById('recent-stock-list');
                if (!container) return;

                const movements = DataManager.getAllStockMovements()
                    .filter(m => m.type === 'in')
                    .slice(0, 5);

                container.innerHTML = '';

                if (movements.length === 0) {
                    container.innerHTML = '<small class="text-muted">최근 입고 내역이 없습니다.</small>';
                    return;
                }

                movements.forEach(movement => {
                    const item = document.createElement('div');
                    item.className = 'activity-item';
                    item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <small><strong>${movement.productName}</strong></small><br>
                    <small class="text-muted">+${movement.quantity}개</small>
                </div>
                <small class="text-muted">${Utils.formatDate(movement.date)}</small>
            </div>
        `;
                    container.appendChild(item);
                });
            }

// 입고 등록 모달 표시
function showStockInModal(productId = null) {
                if (productId) {
                    const select = document.getElementById('stock-product-select');
                    if (select) {
                        select.value = productId;
                    }
                }

                const modal = new bootstrap.Modal(document.getElementById('stockInModal'));
                modal.show();
            }

// 입고 처리
function processStockIn() {
                const productId = parseInt(document.getElementById('stock-product-select').value);
                const quantity = parseInt(document.getElementById('stock-quantity').value);
                const unitCost = parseFloat(document.getElementById('stock-unit-cost').value) || 0;
                const supplier = document.getElementById('stock-supplier').value;
                const notes = document.getElementById('stock-notes').value;

                if (!productId || !quantity || quantity <= 0) {
                    Utils.showAlert('상품과 수량을 올바르게 입력해주세요.', 'danger');
                    return;
                }

                const product = DataManager.addStock(
                    productId,
                    quantity,
                    supplier,
                    notes || '입고 등록'
                );

                if (product) {
                    Utils.showAlert(`${product.name} ${quantity}개가 입고되었습니다.`, 'success');

                    // 모달 닫기
                    const modal = bootstrap.Modal.getInstance(document.getElementById('stockInModal'));
                    if (modal) modal.hide();

                    // 폼 리셋
                    document.getElementById('stock-in-form').reset();

                    // 화면 업데이트
                    updateInventoryStats();
                    loadLowStockItems();
                    loadInventoryTable();
                    loadStockMovements();
                    loadRecentStockIn();
                    updateCharts();
                }
            }

// 재고 조정 모달 표시
function showStockAdjustModal(productId) {
                const product = DataManager.getProductById(productId);
                if (!product) return;

                // 조정 폼에 데이터 채우기
                document.getElementById('adjust-product-id').value = product.id;
                document.getElementById('adjust-product-name').value = product.name;
                document.getElementById('adjust-current-stock').value = product.stock;
                document.getElementById('adjust-new-stock').value = product.stock;

                // 폼 리셋
                document.getElementById('adjust-reason').value = '';
                document.getElementById('adjust-notes').value = '';

                const modal = new bootstrap.Modal(document.getElementById('stockAdjustModal'));
                modal.show();
            }

// 재고 조정 처리
function processStockAdjustment() {
                const productId = parseInt(document.getElementById('adjust-product-id').value);
                const newStock = parseInt(document.getElementById('adjust-new-stock').value);
                const reason = document.getElementById('adjust-reason').value;
                const notes = document.getElementById('adjust-notes').value;

                if (!productId || newStock < 0 || !reason) {
                    Utils.showAlert('모든 필수 필드를 입력해주세요.', 'danger');
                    return;
                }

                const product = DataManager.getProductById(productId);
                if (!product) return;

                const previousStock = product.stock;
                const adjustmentNote = `${reason} - ${notes || '조정'}`;

                const updatedProduct = DataManager.updateStock(productId, newStock, 'adjust', adjustmentNote);

                if (updatedProduct) {
                    const difference = newStock - previousStock;
                    const changeText = difference > 0 ? `+${difference}` : `${difference}`;

                    Utils.showAlert(
                        `${product.name}의 재고가 ${previousStock}개에서 ${newStock}개로 조정되었습니다. (${changeText})`,
                        'success'
                    );

                    // 모달 닫기
                    const modal = bootstrap.Modal.getInstance(document.getElementById('stockAdjustModal'));
                    if (modal) modal.hide();

                    // 화면 업데이트
                    updateInventoryStats();
                    loadLowStockItems();
                    loadInventoryTable();
                    loadStockMovements();
                    updateCharts();
                }
            }

// 알림 새로고침
function refreshAlerts() {
                loadLowStockItems();
                Utils.showAlert('재고 알림이 새로고침되었습니다.', 'info');
            }

// 재고 보고서 생성
function generateStockReport() {
                const products = DataManager.getAllProducts();
                const stats = DataManager.getStats();
                const movements = DataManager.getAllStockMovements();

                let reportContent = `
# 재고 관리 보고서
생성일시: ${new Date().toLocaleString('ko-KR')}

## 재고 현황 요약
- 총 상품 수: ${stats.totalProducts}개
- 총 재고 수량: ${products.reduce((sum, p) => sum + p.stock, 0)}개
- 총 재고 가치: ${Utils.formatCurrency(stats.totalValue)}
- 재고 부족 상품: ${stats.lowStockCount}개

## 카테고리별 현황
`;

                const categoryStats = DataManager.getCategoryStats();
                Object.keys(categoryStats).forEach(category => {
                    const stat = categoryStats[category];
                    reportContent += `- ${category}: ${stat.count}개 상품, ${stat.stock}개 재고, ${Utils.formatCurrency(stat.value)} 가치\n`;
                });

                reportContent += `\n## 재고 부족 상품\n`;
                if (stats.lowStockProducts.length > 0) {
                    stats.lowStockProducts.forEach(product => {
                        reportContent += `- ${product.name}: ${product.stock}개 (최소: ${product.minStock}개)\n`;
                    });
                } else {
                    reportContent += '재고 부족 상품이 없습니다.\n';
                }

                reportContent += `\n## 최근 재고 이동 (최근 10건)\n`;
                movements.slice(0, 10).forEach(movement => {
                    reportContent += `- ${Utils.formatDateTime(movement.date)} | ${movement.productName} | ${Utils.getMovementTypeText(movement.type)} | ${movement.quantity > 0 ? '+' : ''}${movement.quantity}개\n`;
                });

                // 보고서를 새 창에서 표시
                const reportWindow = window.open('', '_blank');
                reportWindow.document.write(`
        <html>
        <head>
            <title>재고 관리 보고서</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1, h2 { color: #333; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <pre>${reportContent}</pre>
            <br>
            <button onclick="window.print()">인쇄</button>
            <button onclick="window.close()">닫기</button>
        </body>
        </html>
    `);

                Utils.showAlert('재고 보고서가 생성되었습니다.', 'success');
            }

// 차트 업데이트
function updateCharts() {
                if (inventoryChart) {
                    inventoryChart.destroy();
                    initializeInventoryChart();
                }
                if (stockLevelChart) {
                    stockLevelChart.destroy();
                    initializeStockLevelChart();
                }
            }

// 로그아웃
function logout() {
                if (Utils.confirm('로그아웃하시겠습니까?')) {
                    sessionStorage.removeItem('isLoggedIn');
                    window.location.href = 'index.html';
                }
            }

// 페이지 초기화 함수들
function initializeInventoryPage() {
                updateInventoryStats();
                initializeCharts();
                loadLowStockItems();
                loadQuickStockForm();
                loadInventoryTable();
                loadStockMovements();
                loadRecentStockIn();
                setupEventListeners();
            }

// 키보드 단축키
document.addEventListener('keydown', function (e) {
                // Ctrl+I: 입고 등록
                if (e.ctrlKey && e.key === 'i') {
                    e.preventDefault();
                    showStockInModal();
                }

                // Ctrl+R: 새로고침
                if (e.ctrlKey && e.key === 'r') {
                    e.preventDefault();
                    refreshAlerts();
                }

                // Ctrl+P: 보고서 생성
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    generateStockReport();
                }
            });

        // 실시간 업데이트 (10분마다)
        setInterval(function () {
            updateInventoryStats();
            loadLowStockItems();
        }, 600000);

        // 차트 리사이즈 핸들러
        window.addEventListener('resize', function () {
            if (inventoryChart) {
                inventoryChart.resize();
            }
            if (stockLevelChart) {
                stockLevelChart.resize();
            }
        });

        // 페이지 언로드 시 차트 정리
        window.addEventListener('beforeunload', function () {
            if (inventoryChart) {
                inventoryChart.destroy();
            }
            if (stockLevelChart) {
                stockLevelChart.destroy();
            }
            DataManager.saveToLocalStorage();
        });