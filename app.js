const STORAGE_KEY = 'mughouse-stock-site-v1';

const state = {
  db: null,
  view: 'home',
  sort: 'featured',
  filters: {
    query: '',
    keyword: '',
    priceMax: 200,
    statuses: [],
    sizes: []
  }
};

const categoryColors = ['#7f1836', '#a12b53', '#c44a72', '#dc7293', '#ef99b2', '#f2bfd0', '#8d1f43', '#b74868'];

const dom = {
  navButtons: [...document.querySelectorAll('.nav-btn')],
  views: [...document.querySelectorAll('.view')],
  projectTitle: document.getElementById('project-title'),
  projectSummary: document.getElementById('project-summary'),
  projectProblem: document.getElementById('problem-text'),
  projectJustification: document.getElementById('justification-text'),
  projectObjective: document.getElementById('general-objective'),
  heroMetrics: document.getElementById('hero-metrics'),
  specificObjectives: document.getElementById('specific-objectives'),
  benefitsList: document.getElementById('benefits-list'),
  showcaseGrid: document.getElementById('showcase-grid'),
  functionalRequirements: document.getElementById('functional-requirements'),
  nonFunctionalRequirements: document.getElementById('non-functional-requirements'),
  techStack: document.getElementById('tech-stack'),
  workshopContext: document.getElementById('workshop-context'),
  workshopValidated: document.getElementById('workshop-validated'),
  workshopFeedbacks: document.getElementById('workshop-feedbacks'),
  workshopConclusion: document.getElementById('workshop-conclusion'),
  referencesList: document.getElementById('references-list'),
  performanceList: document.getElementById('performance-list'),
  priceFilterValue: document.getElementById('price-filter-value'),
  keywordFilter: document.getElementById('keyword-filter'),
  catalogSearch: document.getElementById('catalog-search'),
  priceRange: document.getElementById('price-range'),
  statusFilters: [...document.querySelectorAll('.status-filter')],
  sizeFilters: [...document.querySelectorAll('.size-filter')],
  chips: [...document.querySelectorAll('.chip')],
  catalogGrid: document.getElementById('catalog-grid'),
  managedGrid: document.getElementById('managed-grid'),
  kpiGrid: document.getElementById('kpi-grid'),
  barChart: document.getElementById('bar-chart'),
  donutChart: document.getElementById('donut-chart'),
  donutLegend: document.getElementById('donut-legend'),
  reorderAlerts: document.getElementById('reorder-alerts'),
  transactionsList: document.getElementById('transactions-list'),
  jsonOutput: document.getElementById('json-output'),
  downloadJson: document.getElementById('download-json'),
  clearFilters: document.getElementById('clear-filters'),
  openCreateProduct: document.getElementById('open-create-product'),
  openCreateFromSidebar: document.getElementById('open-create-from-sidebar'),
  modal: document.getElementById('product-modal'),
  modalTitle: document.getElementById('modal-title'),
  productForm: document.getElementById('product-form'),
  drawer: document.getElementById('detail-drawer'),
  detailContent: document.getElementById('detail-content')
};

init();

async function init() {
  const response = await fetch('data/db.json');
  const seed = await response.json();
  const stored = localStorage.getItem(STORAGE_KEY);
  state.db = stored ? JSON.parse(stored) : seed;
  bindEvents();
  renderAll();
}

function bindEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.go));
  });

  dom.catalogSearch.addEventListener('input', (event) => {
    state.filters.query = event.target.value.toLowerCase();
    renderCatalog();
  });

  dom.keywordFilter.addEventListener('input', (event) => {
    state.filters.keyword = event.target.value.toLowerCase();
    renderCatalog();
  });

  dom.priceRange.addEventListener('input', (event) => {
    state.filters.priceMax = Number(event.target.value);
    dom.priceFilterValue.textContent = `R$ 0 — R$ ${event.target.value}`;
    renderCatalog();
  });

  dom.statusFilters.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      state.filters.statuses = dom.statusFilters.filter((item) => item.checked).map((item) => item.value);
      renderCatalog();
    });
  });

  dom.sizeFilters.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      state.filters.sizes = dom.sizeFilters.filter((item) => item.checked).map((item) => item.value);
      renderCatalog();
    });
  });

  dom.chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.chips.forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      state.sort = chip.dataset.sort;
      renderCatalog();
    });
  });

  dom.clearFilters.addEventListener('click', clearFilters);
  dom.openCreateProduct.addEventListener('click', () => openModal());
  dom.openCreateFromSidebar.addEventListener('click', () => openModal());
  dom.downloadJson.addEventListener('click', downloadJsonFile);

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.querySelectorAll('[data-close-drawer]').forEach((button) => {
    button.addEventListener('click', closeDrawer);
  });

  dom.productForm.addEventListener('submit', handleProductSubmit);
}

function setView(view) {
  state.view = view;
  dom.navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  dom.views.forEach((section) => section.classList.toggle('active', section.id === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAll() {
  renderHome();
  renderCatalog();
  renderManagedProducts();
  renderReports();
  renderJson();
}

function renderHome() {
  const { project, requirements, techStack, references, screenshots, kpis } = state.db;
  dom.projectTitle.textContent = project.title;
  dom.projectSummary.textContent = project.summary;
  dom.projectProblem.textContent = project.problem;
  dom.projectJustification.textContent = project.justification;
  dom.projectObjective.textContent = project.generalObjective;

  dom.heroMetrics.innerHTML = [
    metricTemplate('Total produtos', `${state.db.products.length}`),
    metricTemplate('Vendas 30d', `${calculateSales30d()}`),
    metricTemplate('Estoque baixo', `${getLowStockProducts().length}`),
    metricTemplate('Itens esgotados', `${state.db.products.filter((item) => item.status === 'esgotado').length}`)
  ].join('');

  dom.specificObjectives.innerHTML = project.specificObjectives.map(listItem).join('');
  dom.benefitsList.innerHTML = project.benefits.map(listItem).join('');
  dom.functionalRequirements.innerHTML = requirements.functional.map((item) => `<li><strong>${item.id}</strong> — ${item.description}</li>`).join('');
  dom.nonFunctionalRequirements.innerHTML = requirements.nonFunctional.map((item) => `<li><strong>${item.id}</strong> — ${item.description}</li>`).join('');
  dom.techStack.innerHTML = techStack.map((tech) => `
    <article class="tech-card">
      <h4>${tech.name}</h4>
      <div class="tech-role">${tech.role}</div>
      <p>${tech.description}</p>
    </article>
  `).join('');
  dom.workshopContext.textContent = project.workshop.context;
  dom.workshopValidated.innerHTML = project.workshop.validatedFeatures.map(listItem).join('');
  dom.workshopFeedbacks.innerHTML = project.workshop.feedbacks.map(listItem).join('');
  dom.workshopConclusion.textContent = project.workshop.conclusion;
  dom.referencesList.innerHTML = references.map((reference) => `<li>${reference}</li>`).join('');
  dom.showcaseGrid.innerHTML = screenshots.map((shot) => `
    <article class="showcase-card content-card">
      <img src="${shot.file}" alt="${shot.title}" />
      <div class="showcase-meta">
        <h4>${shot.title}</h4>
        <p class="muted">Tela usada como referência visual para este site funcional.</p>
      </div>
    </article>
  `).join('');
}

function renderCatalog() {
  const products = getFilteredProducts();
  dom.performanceList.innerHTML = getTopSellingProducts(3).map((product) => `
    <article class="performance-item">
      <img src="${getProductImage(product)}" alt="${product.name}" />
      <div>
        <h4>${product.name}</h4>
        <div class="small-text">${product.sales30d} vendas em 30 dias</div>
        <button class="link-btn" onclick="openDetail('${product.id}')">Relatório</button>
      </div>
    </article>
  `).join('');

  if (!products.length) {
    dom.catalogGrid.innerHTML = `<div class="empty-state">Nenhum produto encontrado com os filtros atuais.</div>`;
    return;
  }

  dom.catalogGrid.innerHTML = products.map((product) => `
    <article class="product-card content-card">
      <img class="product-thumb" src="${getProductImage(product)}" alt="${product.name}" />
      <div class="product-body">
        <div class="product-meta"><span class="category-pill">${product.category}</span></div>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-meta">${truncate(product.description, 95)}</p>
        <div class="product-bottom">
          <div>
            <div class="price-tag">${formatCurrency(product.priceSale)}</div>
            <span class="status-pill ${normalizeStatus(product)}">${getStatusLabel(normalizeStatus(product))}</span>
          </div>
          <button class="soft-btn" onclick="openDetail('${product.id}')">Detalhes</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderManagedProducts() {
  dom.managedGrid.innerHTML = state.db.products.map((product) => `
    <article class="managed-card content-card">
      <img class="managed-thumb" src="${getProductImage(product)}" alt="${product.name}" />
      <div class="managed-body">
        <h3 class="managed-title">${product.name}</h3>
        <p class="managed-desc">${truncate(product.description, 110)}</p>
        <div class="managed-actions">
          <button class="link-btn" onclick="openModal('${product.id}')">Editar</button>
          <button class="soft-btn" onclick="openDetail('${product.id}')">Visualizar</button>
          <button class="danger-btn" onclick="deleteProduct('${product.id}')">Excluir</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderReports() {
  const kpis = calculateKpis();
  dom.kpiGrid.innerHTML = [
    kpiTemplate('Total produtos', kpis.totalProducts),
    kpiTemplate('Valor em estoque', formatCurrency(kpis.stockValue)),
    kpiTemplate('Esgotados', kpis.outOfStock),
    kpiTemplate('Vendas (30d)', kpis.sales30d)
  ].join('');

  const topProducts = getTopSellingProducts(6);
  const maxSales = Math.max(...topProducts.map((product) => product.sales30d), 1);
  dom.barChart.innerHTML = topProducts.map((product) => `
    <div class="bar-item">
      <div class="bar-value">${product.sales30d}</div>
      <div class="bar-track">
        <div class="bar-fill" style="height: ${(product.sales30d / maxSales) * 100}%"></div>
      </div>
      <div class="bar-label">${shortName(product.name)}</div>
    </div>
  `).join('');

  const categories = buildCategoryDistribution();
  let gradient = 'conic-gradient(';
  let current = 0;
  categories.forEach((item, index) => {
    const next = current + item.percent;
    gradient += `${categoryColors[index % categoryColors.length]} ${current}% ${next}%${index < categories.length - 1 ? ',' : ''}`;
    current = next;
  });
  gradient += ')';
  dom.donutChart.style.background = gradient;
  dom.donutLegend.innerHTML = categories.map((item, index) => `
    <div class="legend-item">
      <div class="legend-label"><span class="legend-dot" style="background:${categoryColors[index % categoryColors.length]}"></span>${item.category}</div>
      <strong>${item.percent.toFixed(0)}%</strong>
    </div>
  `).join('');

  const alerts = getLowStockProducts();
  dom.reorderAlerts.innerHTML = alerts.length ? alerts.map((product) => `
    <article class="alert-item">
      <strong>${product.name}</strong>
      <div class="small-text">Quantidade atual: ${product.quantity} • Nível mínimo: ${product.reorderLevel}</div>
      <div class="mini-actions">
        <button class="warning-btn" onclick="markForReorder('${product.id}')">Marcar pedido feito</button>
        <button class="link-btn" onclick="openDetail('${product.id}')">Abrir produto</button>
      </div>
    </article>
  `).join('') : `<div class="empty-state">Nenhum alerta de reposição no momento.</div>`;

  dom.transactionsList.innerHTML = [...state.db.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map((transaction) => {
      const product = state.db.products.find((item) => item.id === transaction.productId);
      return `
        <article class="timeline-item">
          <strong>${transaction.type === 'entrada' ? 'Entrada' : 'Saída'} • ${product?.name || 'Produto removido'}</strong>
          <div class="small-text">Quantidade: ${transaction.quantity} • ${formatDate(transaction.date)}</div>
          <div class="small-text">${transaction.notes}</div>
        </article>
      `;
    })
    .join('');
}

function renderJson() {
  const updated = {
    ...state.db,
    kpis: calculateKpis()
  };
  dom.jsonOutput.textContent = JSON.stringify(updated, null, 2);
}

function openModal(productId) {
  const product = state.db.products.find((item) => item.id === productId);
  dom.productForm.reset();

  if (product) {
    dom.modalTitle.textContent = 'Editar produto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('form-name').value = product.name;
    document.getElementById('form-cost').value = product.priceCost;
    document.getElementById('form-price').value = product.priceSale;
    document.getElementById('form-quantity').value = product.quantity;
    document.getElementById('form-reorder').value = product.reorderLevel;
    document.getElementById('form-category').value = product.category;
    document.getElementById('form-size').value = product.size;
    document.getElementById('form-abv').value = product.abv;
    document.getElementById('form-status').value = normalizeStatus(product);
    document.getElementById('form-description').value = product.description;
  } else {
    dom.modalTitle.textContent = 'Novo produto';
    document.getElementById('product-id').value = '';
    document.getElementById('form-status').value = 'em_estoque';
  }

  dom.modal.classList.remove('hidden');
  dom.modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  dom.modal.classList.add('hidden');
  dom.modal.setAttribute('aria-hidden', 'true');
}

function openDetail(productId) {
  const product = state.db.products.find((item) => item.id === productId);
  if (!product) return;

  const margin = calculateMargin(product);
  const status = normalizeStatus(product);
  dom.detailContent.innerHTML = `
    <div class="detail-layout">
      <div>
        <img class="detail-thumb" src="${getProductImage(product)}" alt="${product.name}" />
      </div>
      <div class="detail-info">
        <span class="category-pill">${product.category}</span>
        <h3>${product.name}</h3>
        <div class="small-text">${product.size} • ${product.abv || 'Sem teor informado'}</div>
        <div class="detail-price">${formatCurrency(product.priceSale)}</div>
        <span class="status-pill ${status}">${getStatusLabel(status)}</span>

        <div class="detail-grid">
          <label class="detail-field">
            <span class="detail-label">Preço de venda</span>
            <input id="detail-price-input" type="number" min="0" step="0.01" value="${product.priceSale}" />
          </label>
          <label class="detail-field">
            <span class="detail-label">Disponibilidade</span>
            <select id="detail-status-select">
              <option value="em_estoque" ${status === 'em_estoque' ? 'selected' : ''}>Em estoque</option>
              <option value="esgotado" ${status === 'esgotado' ? 'selected' : ''}>Esgotado</option>
              <option value="repor" ${status === 'repor' ? 'selected' : ''}>Pedido feito</option>
            </select>
          </label>
        </div>

        <div class="detail-grid">
          <label class="detail-field">
            <span class="detail-label">Quantidade</span>
            <input id="detail-quantity-input" type="number" min="0" step="1" value="${product.quantity}" />
          </label>
          <label class="detail-field">
            <span class="detail-label">Margem estimada</span>
            <input type="text" value="${margin}%" disabled />
          </label>
        </div>

        <div class="detail-actions">
          <button class="primary-btn" onclick="saveDetailChanges('${product.id}')">Salvar</button>
          <button class="soft-btn" onclick="registerMovement('${product.id}', 'entrada')">Registrar entrada</button>
          <button class="warning-btn" onclick="registerMovement('${product.id}', 'saida')">Registrar saída</button>
          <button class="danger-btn" onclick="deleteProduct('${product.id}')">Excluir produto</button>
        </div>

        <div class="detail-description">
          <strong>Descrição</strong>
          <p>${product.description}</p>
          <div class="footer-note">O documento também sugere expansão do sistema com relatórios analíticos e cálculo de margem de lucro após a oficina de validação.</div>
        </div>
      </div>
    </div>
  `;

  dom.drawer.classList.remove('hidden');
  dom.drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  dom.drawer.classList.add('hidden');
  dom.drawer.setAttribute('aria-hidden', 'true');
}

function saveDetailChanges(productId) {
  const product = state.db.products.find((item) => item.id === productId);
  if (!product) return;
  product.priceSale = Number(document.getElementById('detail-price-input').value);
  product.quantity = Number(document.getElementById('detail-quantity-input').value);
  product.status = document.getElementById('detail-status-select').value;
  normalizeProduct(product);
  persist();
  openDetail(productId);
}

function handleProductSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('product-id').value;
  const payload = {
    name: document.getElementById('form-name').value.trim(),
    category: document.getElementById('form-category').value,
    size: document.getElementById('form-size').value,
    abv: document.getElementById('form-abv').value.trim(),
    priceCost: Number(document.getElementById('form-cost').value),
    priceSale: Number(document.getElementById('form-price').value),
    quantity: Number(document.getElementById('form-quantity').value),
    reorderLevel: Number(document.getElementById('form-reorder').value),
    status: document.getElementById('form-status').value,
    description: document.getElementById('form-description').value.trim() || 'Descrição não informada.',
    sales30d: 0,
    rating: 4.2,
    featured: false,
    image: '',
    slug: slugify(document.getElementById('form-name').value),
    thumbFocus: 'default'
  };

  if (id) {
    const current = state.db.products.find((item) => item.id === id);
    Object.assign(current, payload);
    current.id = id;
    normalizeProduct(current);
  } else {
    const newProduct = {
      id: `p${Date.now().toString().slice(-6)}`,
      ...payload
    };
    normalizeProduct(newProduct);
    state.db.products.unshift(newProduct);
  }

  persist();
  closeModal();
}

function deleteProduct(productId) {
  const product = state.db.products.find((item) => item.id === productId);
  if (!product) return;
  const confirmed = window.confirm(`Deseja excluir ${product.name}?`);
  if (!confirmed) return;
  state.db.products = state.db.products.filter((item) => item.id !== productId);
  state.db.transactions = state.db.transactions.filter((item) => item.productId !== productId);
  persist();
  closeDrawer();
}

function registerMovement(productId, type) {
  const product = state.db.products.find((item) => item.id === productId);
  if (!product) return;
  const amountText = window.prompt(`Informe a quantidade para ${type === 'entrada' ? 'entrada' : 'saída'}:`);
  const quantity = Number(amountText);
  if (!quantity || quantity < 0) return;

  if (type === 'saida' && quantity > product.quantity) {
    window.alert('Quantidade insuficiente em estoque para esta saída.');
    return;
  }

  product.quantity = type === 'entrada' ? product.quantity + quantity : product.quantity - quantity;
  if (type === 'saida') {
    product.sales30d += quantity;
  }
  normalizeProduct(product);

  state.db.transactions.unshift({
    id: `t${Date.now()}`,
    type,
    productId,
    quantity,
    date: new Date().toISOString().slice(0, 10),
    notes: type === 'entrada' ? 'Movimentação manual pelo painel de detalhe' : 'Venda registrada pelo painel de detalhe'
  });

  persist();
  openDetail(productId);
}

function markForReorder(productId) {
  const product = state.db.products.find((item) => item.id === productId);
  if (!product) return;
  product.status = 'repor';
  persist();
}

function clearFilters() {
  state.filters = { query: '', keyword: '', priceMax: 200, statuses: [], sizes: [] };
  dom.catalogSearch.value = '';
  dom.keywordFilter.value = '';
  dom.priceRange.value = '200';
  dom.priceFilterValue.textContent = 'R$ 0 — R$ 200';
  dom.statusFilters.forEach((item) => (item.checked = false));
  dom.sizeFilters.forEach((item) => (item.checked = false));
  state.sort = 'featured';
  dom.chips.forEach((item) => item.classList.toggle('active', item.dataset.sort === 'featured'));
  renderCatalog();
}

function getFilteredProducts() {
  const query = `${state.filters.query} ${state.filters.keyword}`.trim();
  let products = [...state.db.products].filter((product) => {
    const status = normalizeStatus(product);
    const combinedText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    const matchesQuery = !query || combinedText.includes(query);
    const matchesPrice = product.priceSale <= state.filters.priceMax;
    const matchesStatus = !state.filters.statuses.length || state.filters.statuses.includes(status);
    const matchesSize = !state.filters.sizes.length || state.filters.sizes.includes(product.size);
    return matchesQuery && matchesPrice && matchesStatus && matchesSize;
  });

  switch (state.sort) {
    case 'priceAsc':
      products.sort((a, b) => a.priceSale - b.priceSale);
      break;
    case 'priceDesc':
      products.sort((a, b) => b.priceSale - a.priceSale);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    default:
      products.sort((a, b) => Number(b.featured) - Number(a.featured) || b.sales30d - a.sales30d);
  }

  return products;
}

function calculateKpis() {
  return {
    totalProducts: state.db.products.length,
    stockValue: Number(state.db.products.reduce((sum, product) => sum + product.quantity * product.priceSale, 0).toFixed(2)),
    outOfStock: state.db.products.filter((product) => normalizeStatus(product) === 'esgotado').length,
    sales30d: calculateSales30d()
  };
}

function calculateSales30d() {
  return state.db.products.reduce((sum, product) => sum + Number(product.sales30d || 0), 0);
}

function buildCategoryDistribution() {
  const grouped = state.db.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(grouped).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(grouped)
    .map(([category, count]) => ({ category, count, percent: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

function getLowStockProducts() {
  return state.db.products
    .filter((product) => product.quantity <= product.reorderLevel)
    .sort((a, b) => a.quantity - b.quantity);
}

function getTopSellingProducts(limit = 3) {
  return [...state.db.products]
    .sort((a, b) => b.sales30d - a.sales30d)
    .slice(0, limit);
}

function getProductImage(product) {
  const map = {
    amarula: 'assets/products/amarula.png',
    absolut: 'assets/products/absolut.png',
    orloff: 'assets/products/orloff.png',
    jack: 'assets/products/jack.png',
    tanqueray: 'assets/products/tanqueray.png',
    heineken: 'assets/products/heineken.png'
  };

  if (map[product.thumbFocus]) return map[product.thumbFocus];

  const label = encodeURIComponent(`${product.category}\n${product.name}`);
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='%237f1836'/><stop offset='100%' stop-color='%23d66b92'/></linearGradient></defs><rect fill='url(%23g)' width='800' height='600'/><g fill='white' opacity='0.12'><circle cx='130' cy='120' r='90'/><circle cx='700' cy='520' r='140'/></g><text x='56' y='250' fill='white' font-size='48' font-family='Arial, sans-serif' font-weight='700'>${label}</text></svg>`;
}

function normalizeStatus(product) {
  if (product.quantity <= 0) return 'esgotado';
  if (product.status === 'repor') return 'repor';
  return 'em_estoque';
}

function normalizeProduct(product) {
  if (product.quantity <= 0) {
    product.status = 'esgotado';
  } else if (product.status !== 'repor') {
    product.status = 'em_estoque';
  }
}

function metricTemplate(label, value) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`;
}

function kpiTemplate(label, value) {
  return `<article class="kpi-card"><span>${label}</span><strong>${value}</strong></article>`;
}

function listItem(text) {
  return `<li>${text}</li>`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

function calculateMargin(product) {
  if (!product.priceCost) return '0';
  return (((product.priceSale - product.priceCost) / product.priceSale) * 100).toFixed(1).replace('.', ',');
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function shortName(name) {
  return name.replace(/\s\d.*$/, '').split(' ').slice(0, 2).join(' ');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function getStatusLabel(status) {
  const labels = {
    em_estoque: 'Em estoque',
    esgotado: 'Esgotado',
    repor: 'Pedido feito'
  };
  return labels[status] || status;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
  renderAll();
}

function downloadJsonFile() {
  const blob = new Blob([JSON.stringify({ ...state.db, kpis: calculateKpis() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'db.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

window.openModal = openModal;
window.openDetail = openDetail;
window.deleteProduct = deleteProduct;
window.saveDetailChanges = saveDetailChanges;
window.registerMovement = registerMovement;
window.markForReorder = markForReorder;
