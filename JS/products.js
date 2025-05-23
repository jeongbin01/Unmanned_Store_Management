// products.js - 상품 관리 페이지 스크립트

// DOM 요소들
let productTableBody;
let searchInput;
let categoryFilter;
let statusFilter;
let selectAllCheckbox;
let selectedCount;
let bulkDeleteBtn;
let productModal;
let productForm;
let modalTitle;
let productIdInput;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 확인
    checkAuth();
    
    // DOM 요소 초기화
    initializeElements();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 초기 데이터 로드
    loadProducts();
    
    // 카테고리 옵션 로드
    loadCategoryOptions();
});

// DOM 요소 초기화
function initializeElements() {
    productTableBody = document.getElementById('productTableBody');
    searchInput = document.getElementById('searchInput');
    categoryFilter = document.getElementById('categoryFilter');
    statusFilter = document.getElementById('statusFilter');
    selectAllCheckbox = document.getElementById('selectAll');
    selectedCount = document.getElementById('selectedCount');
    bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productForm = document.getElementById('productForm');
    modalTitle = document.getElementById('modalTitle');
    productIdInput = document.getElementById('productId');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 검색 및 필터링
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    statusFilter.addEventListener('change', filterProducts);
    
    // 일괄 선택
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    
    // 일괄 삭제
    bulkDeleteBtn.addEventListener('click', bulkDeleteProducts);
    
    // 상품 추가 버튼
    document.getElementById('addProductBtn').addEventListener('click', () => {
        openProductModal();
    });
    
    // 폼 제출
    productForm.addEventListener('submit', saveProduct);
    
    // 로그아웃
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// 상품 목록 로드
function loadProducts() {
    const products = getProducts();
    displayProducts(products);
    updateProductStats(products);
}

// 상품 목록 표시
function displayProducts(products) {
    if (!productTableBody) return;
    
    productTableBody.innerHTML = '';
    
    if (products.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-box-open text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">등록된 상품이 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = createProductRow(product);
        productTableBody.appendChild(row);
    });
    
    updateSelectedCount();
}

// 상품 행 생성
function createProductRow(product) {
    const row = document.createElement('tr');
    
    // 재고 상태 결정
    const stockStatus = getStockStatus(product.stock, product.minStock);
    const stockBadge = getStockBadge(stockStatus);
    
    // 가격 포맷팅
    const formattedPrice = formatCurrency(product.price);
    
    row.innerHTML = `
        <td>
            <input type="checkbox" class="form-check-input product-checkbox" 
                   value="${product.id}" onchange="updateSelectedCount()">
        </td>
        <td>
            <img src="${product.image || 'https://via.placeholder.com/40'}" 
                 alt="${product.name}" class="product-image me-2">
            <strong>${product.name}</strong>
            <br><small class="text-muted">${product.barcode}</small>
        </td>
        <td>${product.category}</td>
        <td>${formattedPrice}</td>
        <td>
            <span class="${stockBadge.class}">${product.stock}</span>
            <br><small class="text-muted">최소: ${product.minStock}</small>
        </td>
        <td><span class="badge ${stockBadge.class}">${stockBadge.text}</span></td>
        <td>${formatDate(product.createdAt)}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${product.id}')" 
                        title="편집">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewProductHistory('${product.id}')" 
                        title="판매 내역">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product.id}')" 
                        title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// 재고 상태 뱃지 생성
function getStockBadge(status) {
    const badges = {
        'sufficient': { class: 'badge bg-success', text: '충분' },
        'low': { class: 'badge bg-warning', text: '부족' },
        'out': { class: 'badge bg-danger', text: '품절' }
    };
    return badges[status] || badges['sufficient'];
}

// 상품 통계 업데이트
function updateProductStats(products) {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    
    // 통계 카드 업데이트
    updateStatCard('totalProducts', totalProducts);
    updateStatCard('lowStockProducts', lowStockProducts);
    updateStatCard('outOfStockProducts', outOfStockProducts);
}

// 통계 카드 업데이트
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// 상품 필터링
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    const statusValue = statusFilter.value;
    
    const products = getProducts();
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.barcode.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryValue || product.category === categoryValue;
        
        let matchesStatus = true;
        if (statusValue) {
            const stockStatus = getStockStatus(product.stock, product.minStock);
            matchesStatus = stockStatus === statusValue;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    displayProducts(filteredProducts);
}

// 카테고리 옵션 로드
function loadCategoryOptions() {
    const products = getProducts();
    const categories = [...new Set(products.map(p => p.category))];
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        // 기존 옵션 유지하면서 새 카테고리 추가
        categories.forEach(category => {
            if (![...categoryFilter.options].some(option => option.value === category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }
    
    // 모달의 카테고리 선택도 업데이트
    const productCategory = document.getElementById('productCategory');
    if (productCategory) {
        categories.forEach(category => {
            if (![...productCategory.options].some(option => option.value === category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                productCategory.appendChild(option);
            }
        });
    }
}

// 전체 선택/해제
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    updateSelectedCount();
}

// 선택된 항목 수 업데이트
function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    const count = checkedBoxes.length;
    
    if (selectedCount) {
        selectedCount.textContent = count;
    }
    
    if (bulkDeleteBtn) {
        bulkDeleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
    }
    
    // 전체 선택 체크박스 상태 업데이트
    const allCheckboxes = document.querySelectorAll('.product-checkbox');
    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = count === allCheckboxes.length;
        selectAllCheckbox.indeterminate = count > 0 && count < allCheckboxes.length;
    }
}

// 상품 모달 열기
function openProductModal(productId = null) {
    const isEdit = !!productId;
    modalTitle.textContent = isEdit ? '상품 수정' : '상품 추가';
    
    if (isEdit) {
        const product = getProducts().find(p => p.id === productId);
        if (product) {
            fillProductForm(product);
        }
    } else {
        productForm.reset();
        productIdInput.value = '';
        
        // 바코드 자동 생성
        document.getElementById('productBarcode').value = generateBarcode();
    }
    
    productModal.show();
}

// 상품 폼 채우기
function fillProductForm(product) {
    productIdInput.value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image || '';
}

// 상품 저장
function saveProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(productForm);
    const productData = {
        name: formData.get('name').trim(),
        category: formData.get('category').trim(),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        minStock: parseInt(formData.get('minStock')),
        barcode: formData.get('barcode').trim(),
        description: formData.get('description').trim(),
        image: formData.get('image').trim()
    };
    
    // 유효성 검사
    if (!validateProductData(productData)) {
        return;
    }
    
    const productId = productIdInput.value;
    
    try {
        if (productId) {
            // 수정
            updateProductData(productId, productData);
            showAlert('상품이 성공적으로 수정되었습니다.', 'success');
        } else {
            // 추가
            productData.id = generateId();
            productData.createdAt = new Date().toISOString();
            addProduct(productData);
            showAlert('상품이 성공적으로 추가되었습니다.', 'success');
        }
        
        productModal.hide();
        loadProducts();
        loadCategoryOptions();
        
    } catch (error) {
        showAlert('상품 저장 중 오류가 발생했습니다: ' + error.message, 'danger');
    }
}

// 상품 데이터 유효성 검사
function validateProductData(data) {
    if (!data.name) {
        showAlert('상품명을 입력해주세요.', 'warning');
        return false;
    }
    
    if (!data.category) {
        showAlert('카테고리를 선택해주세요.', 'warning');
        return false;
    }
    
    if (isNaN(data.price) || data.price < 0) {
        showAlert('올바른 가격을 입력해주세요.', 'warning');
        return false;
    }
    
    if (isNaN(data.stock) || data.stock < 0) {
        showAlert('올바른 재고 수량을 입력해주세요.', 'warning');
        return false;
    }
    
    if (isNaN(data.minStock) || data.minStock < 0) {
        showAlert('올바른 최소 재고량을 입력해주세요.', 'warning');
        return false;
    }
    
    if (!data.barcode) {
        showAlert('바코드를 입력해주세요.', 'warning');
        return false;
    }
    
    // 바코드 중복 확인
    const products = getProducts();
    const existingProduct = products.find(p => p.barcode === data.barcode && p.id !== productIdInput.value);
    if (existingProduct) {
        showAlert('이미 존재하는 바코드입니다.', 'warning');
        return false;
    }
    
    return true;
}

// 상품 편집
function editProduct(productId) {
    openProductModal(productId);
}

// 상품 삭제
function deleteProduct(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product) return;
    
    if (confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) {
        try {
            removeProduct(productId);
            showAlert('상품이 삭제되었습니다.', 'success');
            loadProducts();
        } catch (error) {
            showAlert('상품 삭제 중 오류가 발생했습니다.', 'danger');
        }
    }
}

// 일괄 삭제
function bulkDeleteProducts() {
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) return;
    
    if (confirm(`선택된 ${selectedIds.length}개 상품을 삭제하시겠습니까?`)) {
        try {
            selectedIds.forEach(id => removeProduct(id));
            showAlert(`${selectedIds.length}개 상품이 삭제되었습니다.`, 'success');
            loadProducts();
            selectAllCheckbox.checked = false;
        } catch (error) {
            showAlert('상품 삭제 중 오류가 발생했습니다.', 'danger');
        }
    }
}

// 상품 판매 내역 조회
function viewProductHistory(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product) return;
    
    const orders = getOrders();
    const productOrders = orders.filter(order => 
        order.items && order.items.some(item => item.id === productId)
    );
    
    // 모달 생성 및 표시
    const modalHtml = `
        <div class="modal fade" id="productHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            ${product.name} 판매 내역
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${productOrders.length === 0 ? 
                            '<p class="text-center text-muted">판매 내역이 없습니다.</p>' :
                            generateOrderHistoryTable(productOrders, productId)
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거 후 새로 추가
    const existingModal = document.getElementById('productHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const historyModal = new bootstrap.Modal(document.getElementById('productHistoryModal'));
    historyModal.show();
}

// 주문 내역 테이블 생성
function generateOrderHistoryTable(orders, productId) {
    let totalQuantity = 0;
    let totalAmount = 0;
    
    const rows = orders.map(order => {
        const item = order.items.find(item => item.id === productId);
        if (!item) return '';
        
        totalQuantity += item.quantity;
        totalAmount += item.price * item.quantity;
        
        return `
            <tr>
                <td>${formatDate(order.date)}</td>
                <td>#${order.id}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
                <td><span class="badge bg-success">${order.status}</span></td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>주문번호</th>
                        <th>수량</th>
                        <th>단가</th>
                        <th>금액</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot>
                    <tr class="table-info">
                        <th colspan="2">합계</th>
                        <th>${totalQuantity}</th>
                        <th>-</th>
                        <th>${formatCurrency(totalAmount)}</th>
                        <th>-</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

// 바코드 생성
function generateBarcode() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// 알림 표시
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

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .product-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
    }
    
    .btn-group .btn {
        padding: 0.25rem 0.5rem;
    }
    
    .table td {
        vertical-align: middle;
    }
    
    .alert {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .modal-body .table {
        margin-bottom: 0;
    }
    
    .badge {
        font-size: 0.75em;
    }
`;
document.head.appendChild(style);