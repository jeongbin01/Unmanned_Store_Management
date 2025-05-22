// 전역 데이터 저장소
let products = [
  {
    id: 1,
    name: '콜라',
    category: '음료',
    price: 1500,
    stock: 45,
    description: '상쾌한 탄산음료',
    minStock: 10,
    lastStockIn: '2024-11-10',
    supplier: '코카콜라'
  },
  {
    id: 2,
    name: '사이다',
    category: '음료',
    price: 1500,
    stock: 32,
    description: '시원한 레몬 사이다',
    minStock: 10,
    lastStockIn: '2024-11-12',
    supplier: '롯데칠성'
  },
  {
    id: 3,
    name: '초코파이',
    category: '과자',
    price: 2000,
    stock: 8,
    description: '부드러운 초콜릿 파이',
    minStock: 15,
    lastStockIn: '2024-11-08',
    supplier: '오리온'
  },
  {
    id: 4,
    name: '라면',
    category: '간편식품',
    price: 1200,
    stock: 25,
    description: '매콤한 인스턴트 라면',
    minStock: 20,
    lastStockIn: '2024-11-14',
    supplier: '농심'
  },
  {
    id: 5,
    name: '티슈',
    category: '생활용품',
    price: 3000,
    stock: 2,
    description: '부드러운 화장지',
    minStock: 5,
    lastStockIn: '2024-11-05',
    supplier: '유한킴벌리'
  },
  {
    id: 6,
    name: '껌',
    category: '과자',
    price: 800,
    stock: 50,
    description: '민트맛 껌',
    minStock: 20,
    lastStockIn: '2024-11-13',
    supplier: '롯데'
  },
  {
    id: 7,
    name: '물',
    category: '음료',
    price: 1000,
    stock: 60,
    description: '깨끗한 생수',
    minStock: 30,
    lastStockIn: '2024-11-15',
    supplier: '삼다수'
  },
  {
    id: 8,
    name: '컵라면',
    category: '간편식품',
    price: 1800,
    stock: 15,
    description: '간편한 컵라면',
    minStock: 10,
    lastStockIn: '2024-11-11',
    supplier: '농심'
  }
];

let orders = [
  {
    id: 1001,
    product: '콜라',
    productId: 1,
    quantity: 2,
    amount: 3000,
    time: '2024-11-15 14:30',
    status: '완료'
  },
  {
    id: 1002,
    product: '초코파이',
    productId: 3,
    quantity: 1,
    amount: 2000,
    time: '2024-11-15 14:25',
    status: '완료'
  },
  {
    id: 1003,
    product: '라면',
    productId: 4,
    quantity: 3,
    amount: 3600,
    time: '2024-11-15 14:20',
    status: '완료'
  },
  {
    id: 1004,
    product: '사이다',
    productId: 2,
    quantity: 1,
    amount: 1500,
    time: '2024-11-15 14:15',
    status: '완료'
  },
  {
    id: 1005,
    product: '물',
    productId: 7,
    quantity: 2,
    amount: 2000,
    time: '2024-11-15 14:10',
    status: '완료'
  },
  {
    id: 1006,
    product: '컵라면',
    productId: 8,
    quantity: 1,
    amount: 1800,
    time: '2024-11-15 14:05',
    status: '완료'
  },
  {
    id: 1007,
    product: '껌',
    productId: 6,
    quantity: 2,
    amount: 1600,
    time: '2024-11-15 14:00',
    status: '완료'
  }
];

// 재고 이동 내역
let stockMovements = [
  {
    id: 1,
    productId: 1,
    productName: '콜라',
    type: 'in',
    quantity: 50,
    previousStock: 20,
    currentStock: 70,
    date: '2024-11-10 09:00',
    notes: '정기 입고',
    supplier: '코카콜라'
  },
  {
    id: 2,
    productId: 3,
    productName: '초코파이',
    type: 'out',
    quantity: 5,
    previousStock: 13,
    currentStock: 8,
    date: '2024-11-15 14:25',
    notes: '고객 구매'
  },
  {
    id: 3,
    productId: 5,
    productName: '티슈',
    type: 'adjust',
    quantity: -3,
    previousStock: 5,
    currentStock: 2,
    date: '2024-11-14 16:00',
    notes: '상품 손상으로 인한 조정'
  },
  {
    id: 4,
    productId: 7,
    productName: '물',
    type: 'in',
    quantity: 100,
    previousStock: 20,
    currentStock: 120,
    date: '2024-11-15 10:30',
    notes: '대량 입고',
    supplier: '삼다수'
  }
];

// 데이터 조작 함수들
const DataManager = {
  // 상품 관련 함수
  getAllProducts() {
    return products;
  },

  getProductById(id) {
    return products.find(p => p.id === id);
  },

  addProduct(product) {
    const newId = Math.max(...products.map(p => p.id)) + 1;
    const newProduct = {
      ...product,
      id: newId,
      lastStockIn: new Date().toISOString().split('T')[0],
      minStock: product.minStock || 10
    };
    products.push(newProduct);
    return newProduct;
  },

  updateProduct(id, updates) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      return products[index];
    }
    return null;
  },

  deleteProduct(id) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const deleted = products.splice(index, 1);
      return deleted[0];
    }
    return null;
  },

  // 재고 관련 함수
  updateStock(productId, newStock, type = 'adjust', notes = '') {
    const product = this.getProductById(productId);
    if (!product) return null;

    const previousStock = product.stock;
    const quantity = newStock - previousStock;

    product.stock = newStock;

    // 재고 이동 내역 추가
    this.addStockMovement({
      productId: productId,
      productName: product.name,
      type: type,
      quantity: quantity,
      previousStock: previousStock,
      currentStock: newStock,
      notes: notes
    });

    return product;
  },

  addStock(productId, quantity, supplier = '', notes = '') {
    const product = this.getProductById(productId);
    if (!product) return null;

    const previousStock = product.stock;
    product.stock += quantity;
    product.lastStockIn = new Date().toISOString().split('T')[0];

    this.addStockMovement({
      productId: productId,
      productName: product.name,
      type: 'in',
      quantity: quantity,
      previousStock: previousStock,
      currentStock: product.stock,
      notes: notes || '입고',
      supplier: supplier
    });

    return product;
  },

  // 주문 관련 함수
  getAllOrders() {
    return orders.sort((a, b) => new Date(b.time) - new Date(a.time));
  },

  addOrder(order) {
    const newId = Math.max(...orders.map(o => o.id)) + 1;
    const newOrder = {
      ...order,
      id: newId,
      time: new Date().toLocaleString('ko-KR'),
      status: '완료'
    };
    orders.unshift(newOrder);

    // 재고 감소
    if (order.productId) {
      const product = this.getProductById(order.productId);
      if (product) {
        this.updateStock(order.productId, product.stock - order.quantity, 'out', '고객 구매');
      }
    }

    return newOrder;
  },

  // 재고 이동 내역 관련 함수
  getAllStockMovements() {
    return stockMovements.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addStockMovement(movement) {
    const newId = Math.max(...stockMovements.map(m => m.id)) + 1;
    const newMovement = {
      ...movement,
      id: newId,
      date: new Date().toLocaleString('ko-KR')
    };
    stockMovements.unshift(newMovement);
    return newMovement;
  },

  // 통계 관련 함수
  getStats() {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const categories = [...new Set(products.map(p => p.category))];

    // 오늘 매출 계산 (임시 데이터)
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.time.includes(today));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.amount, 0);
    const todayOrderCount = todayOrders.length;

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      categoryCount: categories.length,
      categories,
      todaySales,
      todayOrderCount
    };
  },

  // 카테고리별 재고 통계
  getCategoryStats() {
    const categoryStats = {};
    products.forEach(product => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          count: 0,
          stock: 0,
          value: 0
        };
      }
      categoryStats[product.category].count++;
      categoryStats[product.category].stock += product.stock;
      categoryStats[product.category].value += product.stock * product.price;
    });
    return categoryStats;
  },

  // 검색 및 필터링
  searchProducts(query, category = '', stockLevel = '') {
    let filtered = products;

    // 텍스트 검색
    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // 카테고리 필터
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    // 재고 수준 필터
    if (stockLevel) {
      switch (stockLevel) {
        case 'low':
          filtered = filtered.filter(p => p.stock <= p.minStock);
          break;
        case 'medium':
          filtered = filtered.filter(p => p.stock > p.minStock && p.stock <= p.minStock * 2);
          break;
        case 'high':
          filtered = filtered.filter(p => p.stock > p.minStock * 2);
          break;
      }
    }

    return filtered;
  },

  // 정렬
  sortProducts(products, sortBy) {
    const sorted = [...products];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'stock':
        return sorted.sort((a, b) => b.stock - a.stock);
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sorted;
    }
  },

  // 로컬 스토리지 저장/불러오기
  saveToLocalStorage() {
    localStorage.setItem('storeProducts', JSON.stringify(products));
    localStorage.setItem('storeOrders', JSON.stringify(orders));
    localStorage.setItem('storeStockMovements', JSON.stringify(stockMovements));
  },

  loadFromLocalStorage() {
    const savedProducts = localStorage.getItem('storeProducts');
    const savedOrders = localStorage.getItem('storeOrders');
    const savedMovements = localStorage.getItem('storeStockMovements');

    if (savedProducts) {
      products = JSON.parse(savedProducts);
    }
    if (savedOrders) {
      orders = JSON.parse(savedOrders);
    }
    if (savedMovements) {
      stockMovements = JSON.parse(savedMovements);
    }
  },

  // 데이터 초기화
  resetData() {
    localStorage.removeItem('storeProducts');
    localStorage.removeItem('storeOrders');
    localStorage.removeItem('storeStockMovements');
    location.reload();
  }
};

// 유틸리티 함수들
const Utils = {
  // 날짜 포맷팅
  formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR');
  },

  // 시간 포맷팅
  formatDateTime(date) {
    return new Date(date).toLocaleString('ko-KR');
  },

  // 숫자 포맷팅 (천단위 구분)
  formatNumber(num) {
    return num.toLocaleString('ko-KR');
  },

  // 통화 포맷팅
  formatCurrency(amount) {
    return '₩' + this.formatNumber(amount);
  },

  // 재고 상태 확인
  getStockStatus(stock, minStock = 10) {
    if (stock <= minStock * 0.5) {
      return { class: 'low-stock', text: '부족', level: 'danger' };
    } else if (stock <= minStock) {
      return { class: 'medium-stock', text: '보통', level: 'warning' };
    } else {
      return { class: 'normal-stock', text: '충분', level: 'success' };
    }
  },

  // 이동 타입 텍스트
  getMovementTypeText(type) {
    const types = {
      'in': '입고',
      'out': '출고',
      'adjust': '조정'
    };
    return types[type] || type;
  },

  // 이동 타입 클래스
  getMovementTypeClass(type) {
    const classes = {
      'in': 'text-success',
      'out': 'text-primary',
      'adjust': 'text-warning'
    };
    return classes[type] || '';
  },

  // 알림 표시
  showAlert(message, type = 'success') {
    // 기존 알림 제거
    const existingAlert = document.querySelector('.alert-notification');
    if (existingAlert) {
      existingAlert.remove();
    }

    // 새 알림 생성
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-notification position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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
  },

  // 확인 대화상자
  confirm(message) {
    return confirm(message);
  },

  // 로딩 표시
  showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
  },

  // 로딩 숨기기
  hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
  }
};

// 페이지 로드 시 로컬 스토리지에서 데이터 불러오기
document.addEventListener('DOMContentLoaded', function () {
  DataManager.loadFromLocalStorage();
});

// 페이지 언로드 시 로컬 스토리지에 데이터 저장
window.addEventListener('beforeunload', function () {
  DataManager.saveToLocalStorage();
});