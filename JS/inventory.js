// inventory.js - 재고 관리 페이지 스크립트

// 전역 변수
let inventoryChart;
let stockTrendChart;
let lowStockModal;
let stockAdjustModal;
let stockReceiveModal;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    // 로그인 확인
    checkAuth();

    // 모달 초기화
    initializeModals();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기 데이터 로드
    loadInventoryDashboard();
    loadInventoryTable();
    loadStockMovements();

    // 차트 초기화
    initializeCharts();
});

// 모달 초기화
function initializeModals() {
    lowStockModal = new bootstrap.Modal(document.getElementById('lowStockModal'));
    stockAdjustModal = new bootstrap.Modal(document.getElementById('stockAdjustModal'));
    stockReceiveModal = new bootstrap.Modal(document.getElementById('stockReceiveModal'));
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 재고 부족 알림 보기
    document.getElementById('viewLowStockBtn')?.addEventListener('click', showLowStockModal);

    // 재고 조정 버튼
    document.getElementById('adjustStockBtn')?.addEventListener('click', showStockAdjustModal);

    // 입고 등록 버튼
    document.getElementById('receiveStockBtn')?.addEventListener('click', showStockReceiveModal);

    // 재고 조정 폼 제출
    document.getElementById('stockAdjustForm')?.addEventListener('submit', processStockAdjustment);

    // 입고 등록 폼 제출
    document.getElementById('stockReceiveForm')?.addEventListener('submit', processStockReceive);

    // 보고서 생성 버튼
    document.getElementById('generateReportBtn')?.addEventListener('click', generateInventoryReport);

    // 로그아웃
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // 검색 필터
    document.getElementById('inventorySearch')?.addEventListener('input', filterInventoryTable);
    document.getElementById('categoryFilter')?.addEventListener('change', filterInventoryTable);
    document.getElementById('statusFilter')?.addEventListener('change', filterInventoryTable);
}

// 재고 대시보드 로드
function loadInventoryDashboard() {
    const products = getProducts();

    // 총 상품 수
    const totalProducts = products.length;

    // 재고 부족 상품
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);

    // 품절 상품
    const outOfStockProducts = products.filter(p => p.stock === 0);

    // 총 재고 가치 계산
    const totalStockValue = products.reduce((sum, product) => {
        return sum + (product.stock * product.price);
    }, 0);

    // 카드 업데이트
    updateDashboardCard('totalProductsCard', totalProducts);
    updateDashboardCard('lowStockCard', lowStockProducts.length);
    updateDashboardCard('outOfStockCard', outOfStockProducts.length);
    updateDashboardCard('stockValueCard', formatCurrency(totalStockValue));

    // 재고 부족 알림
    if (lowStockProducts.length > 0 || outOfStockProducts.length > 0) {
        showStockAlert(lowStockProducts.length, outOfStockProducts.length);
    }
}

// 대시보드 카드 업데이트
function updateDashboardCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        const valueElement = card.querySelector('.card-value') || card.querySelector('h3');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
}

// 재고 테이블 로드
function loadInventoryTable() {
    const products = getProducts();
    const tableBody = document.getElementById('inventoryTableBody');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-box-open text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">등록된 상품이 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(product => {
        const row = createInventoryRow(product);
        tableBody.appendChild(row);
    });
}

// 재고 테이블 행 생성
function createInventoryRow(product) {
    const row = document.createElement('tr');
    const stockStatus = getStockStatus(product.stock, product.minStock);
    const stockBadge = getStockStatusBadge(stockStatus);
    const stockValue = product.stock * product.price;

    row.innerHTML = `
        <td>
            <img src="${product.image || 'https://via.placeholder.com/40'}" 
                 alt="${product.name}" class="product-thumbnail me-2">
            <div>
                <strong>${product.name}</strong>
                <br><small class="text-muted">${product.category}</small>
            </div>
        </td>
        <td>
            <span class="fs-5 ${stockStatus === 'out' ? 'text-danger' : stockStatus === 'low' ? 'text-warning' : 'text-success'}">
                ${product.stock}
            </span>
            <br><small class="text-muted">최소: ${product.minStock}</small>
        </td>
        <td><span class="badge ${stockBadge.class}">${stockBadge.text}</span></td>
        <td>${formatCurrency(product.price)}</td>
        <td>${formatCurrency(stockValue)}</td>
        <td>${formatDate(product.lastUpdated || product.createdAt)}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="quickAdjustStock('${product.id}')" 
                        title="재고 조정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="quickReceiveStock('${product.id}')" 
                        title="입고 등록">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewStockHistory('${product.id}')" 
                        title="재고 이동 내역">
                    <i class="fas fa-history"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// 재고 상태 뱃지 생성
function getStockStatusBadge(status) {
    const badges = {
        'sufficient': { class: 'bg-success', text: '충분' },
        'low': { class: 'bg-warning text-dark', text: '부족' },
        'out': { class: 'bg-danger', text: '품절' }
    };
    return badges[status] || badges['sufficient'];
}

// 재고 테이블 필터링
function filterInventoryTable() {
    const searchTerm = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const products = getProducts();
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || product.category === categoryFilter;

        let matchesStatus = true;
        if (statusFilter) {
            const stockStatus = getStockStatus(product.stock, product.minStock);
            matchesStatus = stockStatus === statusFilter;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // 테이블 업데이트
    const tableBody = document.getElementById('inventoryTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        filteredProducts.forEach(product => {
            const row = createInventoryRow(product);
            tableBody.appendChild(row);
        });
    }
}

// 차트 초기화
function initializeCharts() {
    initializeCategoryStockChart();
    initializeStockTrendChart();
}

// 카테고리별 재고 차트
function initializeCategoryStockChart() {
    const ctx = document.getElementById('categoryStockChart');
    if (!ctx) return;

    const products = getProducts();
    const categoryData = {};

    products.forEach(product => {
        if (!categoryData[product.category]) {
            categoryData[product.category] = 0;
        }
        categoryData[product.category] += product.stock;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = generateColors(labels.length);

    inventoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
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

// 재고 추이 차트
function initializeStockTrendChart() {
    const ctx = document.getElementById('stockTrendChart');
    if (!ctx) return;

    // 최근 7일간의 재고 변화 데이터 생성 (실제로는 재고 이동 내역에서 가져와야 함)
    const dates = [];
    const stockValues = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString());

        // 임시 데이터 (실제로는 해당 날짜의 총 재고 가치 계산)
        const products = getProducts();
        const totalValue = products.reduce((sum, product) => {
            return sum + (product.stock * product.price);
        }, 0);

        // 약간의 변화 추가 (실제 데이터로 대체해야 함)
        const variation = (Math.random() - 0.5) * totalValue * 0.1;
        stockValues.push(Math.max(0, totalValue + variation));
    }

    stockTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '재고 가치',
                data: stockValues,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

// 재고 부족 알림 표시
function showStockAlert(lowStockCount, outOfStockCount) {
    const alertContainer = document.getElementById('stockAlerts');
    if (!alertContainer) return;

    let alertHtml = '';

    if (outOfStockCount > 0) {
        alertHtml += `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>품절 경고!</strong> ${outOfStockCount}개 상품이 품절되었습니다.
                <button type="button" class="btn btn-sm btn-outline-light ms-2" onclick="showLowStockModal()">
                    확인하기
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    if (lowStockCount > 0) {
        alertHtml += `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>재고 부족!</strong> ${lowStockCount}개 상품의 재고가 부족합니다.
                <button type="button" class="btn btn-sm btn-outline-dark ms-2" onclick="showLowStockModal()">
                    확인하기
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    alertContainer.innerHTML = alertHtml;
}

// 재고 부족 모달 표시
function showLowStockModal() {
    const products = getProducts();
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    const modalBody = document.getElementById('lowStockModalBody');
    if (!modalBody) return;

    if (lowStockProducts.length === 0) {
        modalBody.innerHTML = '<p class="text-center text-muted">재고 부족 상품이 없습니다.</p>';
    } else {
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>상품명</th>
                            <th>현재 재고</th>
                            <th>최소 재고</th>
                            <th>상태</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockProducts.map(product => {
            const status = getStockStatus(product.stock, product.minStock);
            const badge = getStockStatusBadge(status);
            return `
                                <tr>
                                    <td>
                                        <strong>${product.name}</strong>
                                        <br><small class="text-muted">${product.category}</small>
                                    </td>
                                    <td class="${status === 'out' ? 'text-danger' : 'text-warning'}">${product.stock}</td>
                                    <td>${product.minStock}</td>
                                    <td><span class="badge ${badge.class}">${badge.text}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="quickReceiveStock('${product.id}')">
                                            입고 등록
                                        </button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        modalBody.innerHTML = tableHtml;
    }

    lowStockModal.show();
}

// 재고 조정 모달 표시
function showStockAdjustModal(productId = null) {
    const form = document.getElementById('stockAdjustForm');
    const productSelect = document.getElementById('adjustProductSelect');

    if (!form || !productSelect) return;

    // 상품 옵션 로드
    loadProductOptions(productSelect);

    // 특정 상품이 지정된 경우
    if (productId) {
        productSelect.value = productId;
        updateAdjustProductInfo();
    }

    form.reset();
    stockAdjustModal.show();
}

// 입고 등록 모달 표시
function showStockReceiveModal(productId = null) {
    const form = document.getElementById('stockReceiveForm');
    const productSelect = document.getElementById('receiveProductSelect');

    if (!form || !productSelect) return;

    // 상품 옵션 로드
    loadProductOptions(productSelect);

    // 특정 상품이 지정된 경우
    if (productId) {
        productSelect.value = productId;
        updateReceiveProductInfo();
    }

    form.reset();
    stockReceiveModal.show();
}

// 상품 옵션 로드
function loadProductOptions(selectElement) {
    const products = getProducts();
    selectElement.innerHTML = '<option value="">상품을 선택하세요</option>';

    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (현재: ${product.stock}개)`;
        selectElement.appendChild(option);
    });
}

// 재고 조정 처리
function processStockAdjustment(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    const adjustmentType = formData.get('adjustmentType');
    const quantity = parseInt(formData.get('quantity'));
    const reason = formData.get('reason');

    if (!productId || !quantity || quantity <= 0) {
        showAlert('모든 필드를 올바르게 입력해주세요.', 'warning');
        return;
    }

    try {
        const products = getProducts();
        const product = products.find(p => p.id === productId);

        if (!product) {
            showAlert('상품을 찾을 수 없습니다.', 'danger');
            return;
        }

        let newStock;
        let movementType;

        if (adjustmentType === 'increase') {
            newStock = product.stock + quantity;
            movementType = 'adjustment_in';
        } else {
            newStock = Math.max(0, product.stock - quantity);
            movementType = 'adjustment_out';
        }

        // 상품 재고 업데이트
        product.stock = newStock;
        product.lastUpdated = new Date().toISOString();
        updateProductData(productId, product);

        // 재고 이동 내역 추가
        addStockMovement({
            id: generateId(),
            productId: productId,
            productName: product.name,
            type: movementType,
            quantity: adjustmentType === 'increase' ? quantity : -quantity,
            previousStock: adjustmentType === 'increase' ? product.stock - quantity : product.stock + quantity,
            newStock: newStock,
            reason: reason,
            date: new Date().toISOString(),
            user: 'admin'
        });

        stockAdjustModal.hide();
        showAlert('재고가 성공적으로 조정되었습니다.', 'success');

        // 화면 새로고침
        loadInventoryDashboard();
        loadInventoryTable();
        loadStockMovements();

    } catch (error) {
        showAlert('재고 조정 중 오류가 발생했습니다.', 'danger');
    }
}

// 입고 등록 처리
function processStockReceive(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    const quantity = parseInt(formData.get('quantity'));
    const unitCost = parseFloat(formData.get('unitCost')) || 0;
    const supplier = formData.get('supplier');
    const notes = formData.get('notes');

    if (!productId || !quantity || quantity <= 0) {
        showAlert('모든 필수 필드를 올바르게 입력해주세요.', 'warning');
        return;
    }

    try {
        const products = getProducts();
        const product = products.find(p => p.id === productId);

        if (!product) {
            showAlert('상품을 찾을 수 없습니다.', 'danger');
            return;
        }

        const previousStock = product.stock;
        const newStock = product.stock + quantity;

        // 상품 재고 업데이트
        product.stock = newStock;
        product.lastUpdated = new Date().toISOString();
        updateProductData(productId, product);

        // 재고 이동 내역 추가
        addStockMovement({
            id: generateId(),
            productId: productId,
            productName: product.name,
            type: 'receive',
            quantity: quantity,
            previousStock: previousStock,
            newStock: newStock,
            unitCost: unitCost,
            supplier: supplier,
            notes: notes,
            date: new Date().toISOString(),
            user: 'admin'
        });

        stockReceiveModal.hide();
        showAlert('입고가 성공적으로 등록되었습니다.', 'success');

        // 화면 새로고침
        loadInventoryDashboard();
        loadInventoryTable();
        loadStockMovements();

    } catch (error) {
        showAlert('입고 등록 중 오류가 발생했습니다.', 'danger');
    }
}

// 빠른 재고 조정
function quickAdjustStock(productId) {
    showStockAdjustModal(productId);
}

// 빠른 입고 등록
function quickReceiveStock(productId) {
    showStockReceiveModal(productId);
}

// 재고 이동 내역 조회
function viewStockHistory(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product) return;

    const movements = getStockMovements().filter(m => m.productId === productId);

    // 모달 생성 및 표시
    const modalHtml = `
        <div class="modal fade" id="stockHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            ${product.name} 재고 이동 내역
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${movements.length === 0 ?
            '<p class="text-center text-muted">재고 이동 내역이 없습니다.</p>' :
            generateStockHistoryTable(movements)
        }
                    </div>
                </div>
            </div>
        </div>
    `;

    // 기존 모달 제거 후 새로 추가
    const existingModal = document.getElementById('stockHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const historyModal = new bootstrap.Modal(document.getElementById('stockHistoryModal'));
    historyModal.show();
}

// 재고 이동 내역 테이블 생성
function generateStockHistoryTable(movements) {
    const rows = movements.map(movement => {
        const typeText = getMovementTypeText(movement.type);
        const typeClass = getMovementTypeClass(movement.type);

        return `
            <tr>
                <td>${formatDate(movement.date)}</td>
                <td><span class="badge ${typeClass}">${typeText}</span></td>
                <td class="${movement.quantity > 0 ? 'text-success' : 'text-danger'}">
                    ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
                </td>
                <td>${movement.previousStock}</td>
                <td>${movement.newStock}</td>
                <td>${movement.reason || movement.notes || '-'}</td>
                <td>${movement.user || 'system'}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>유형</th>
                        <th>수량 변화</th>
                        <th>이전 재고</th>
                        <th>현재 재고</th>
                        <th>사유</th>
                        <th>처리자</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// 재고 이동 내역 로드
function loadStockMovements() {
    const movements = getStockMovements();
    const tableBody = document.getElementById('stockMovementsBody');

    if (!tableBody) return;

    // 최근 10개 항목만 표시
    const recentMovements = movements.slice(-10).reverse();

    tableBody.innerHTML = '';

    if (recentMovements.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-history text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">재고 이동 내역이 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }

    recentMovements.forEach(movement => {
        const row = document.createElement('tr');
        const typeText = getMovementTypeText(movement.type);
        const typeClass = getMovementTypeClass(movement.type);

        row.innerHTML = `
            <td>${formatDate(movement.date)}</td>
            <td>
                <strong>${movement.productName}</strong>
                <br><small class="text-muted">${movement.productId}</small>
            </td>
            <td><span class="badge ${typeClass}">${typeText}</span></td>
            <td class="${movement.quantity > 0 ? 'text-success' : 'text-danger'}">
                ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
            </td>
            <td>${movement.newStock}</td>
            <td>${movement.reason || movement.notes || '-'}</td>
        `;

        tableBody.appendChild(row);
    });
}

// 이동 유형 텍스트 반환
function getMovementTypeText(type) {
    const types = {
        'receive': '입고',
        'sale': '판매',
        'adjustment_in': '조정(입고)',
        'adjustment_out': '조정(출고)',
        'return': '반품',
        'damage': '손상',
        'expired': '만료'
    };
    return types[type] || '기타';
}

// 이동 유형 클래스 반환
function getMovementTypeClass(type) {
    const classes = {
        'receive': 'bg-success',
        'sale': 'bg-primary',
        'adjustment_in': 'bg-info',
        'adjustment_out': 'bg-warning text-dark',
        'return': 'bg-secondary',
        'damage': 'bg-danger',
        'expired': 'bg-dark'
    };
    return classes[type] || 'bg-secondary';
}

// 재고 보고서 생성
function generateInventoryReport() {
    const products = getProducts();
    const movements = getStockMovements();

    const reportData = {
        generatedAt: new Date().toISOString(),
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
        lowStockProducts: products.filter(p => p.stock <= p.minStock && p.stock > 0).length,
        outOfStockProducts: products.filter(p => p.stock === 0).length,
        recentMovements: movements.slice(-20),
        categoryBreakdown: getCategoryBreakdown(products)
    };

    // CSV 파일 생성
    generateCSVReport(reportData);

    showAlert('재고 보고서가 생성되었습니다.', 'success');
}

// 카테고리별 분석 데이터
function getCategoryBreakdown(products) {
    const breakdown = {};

    products.forEach(product => {
        if (!breakdown[product.category]) {
            breakdown[product.category] = {
                count: 0,
                totalStock: 0,
                totalValue: 0,
                lowStock: 0,
                outOfStock: 0
            };
        }

        const cat = breakdown[product.category];
        cat.count++;
        cat.totalStock += product.stock;
        cat.totalValue += product.stock * product.price;

        if (product.stock === 0) {
            cat.outOfStock++;
        } else if (product.stock <= product.minStock) {
            cat.lowStock++;
        }
    });

    return breakdown;
}

// CSV 보고서 생성
function generateCSVReport(data) {
    let csv = '재고 보고서\n';
    csv += `생성일시,${formatDate(data.generatedAt)}\n`;
    csv += `총 상품 수,${data.totalProducts}\n`;
    csv += `총 재고 가치,${formatCurrency(data.totalStockValue)}\n`;
    csv += `재고 부족 상품,${data.lowStockProducts}\n`;
    csv += `품절 상품,${data.outOfStockProducts}\n\n`;

    csv += '카테고리별 현황\n';
    csv += '카테고리,상품수,총재고,총가치,재고부족,품절\n';

    Object.entries(data.categoryBreakdown).forEach(([category, stats]) => {
        csv += `${category},${stats.count},${stats.totalStock},${formatCurrency(stats.totalValue)},${stats.lowStock},${stats.outOfStock}\n`;
    });

    // 파일 다운로드
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 색상 생성 함수
function generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// 알림 표시 함수
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    // 자동으로 알림 제거
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert.textContent.includes(message)) {
                alert.remove();
            }
        });
    }, 5000);
}
