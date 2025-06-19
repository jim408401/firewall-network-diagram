 /* ==========================================================================
   UI控制模組
   ========================================================================== */

class UIController {
    constructor() {
        this.initTheme();
        this.initFiltersState();
    }
    
    // 初始化主題
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let currentTheme;
        if (savedTheme) {
            currentTheme = savedTheme;
        } else {
            currentTheme = systemPrefersDark ? 'dark' : 'light';
        }
        
        this.setTheme(currentTheme);
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // 切換主題
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
    
    // 設置主題
    setTheme(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.title = theme === 'dark' ? '切換至明亮模式' : '切換至深色模式';
        }
    }
    
    // 初始化篩選器狀態
    initFiltersState() {
        const filterContent = document.getElementById('filterContent');
        const toggleBtn = document.getElementById('toggleFilters');
        
        if (!filterContent || !toggleBtn) return;
        
        // 從本地存儲讀取篩選器狀態
        const isCollapsed = localStorage.getItem('filtersCollapsed') === 'true';
        
        if (isCollapsed) {
            filterContent.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
        } else {
            filterContent.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
        }
    }
    
    // 切換篩選器顯示/隱藏
    toggleFilters() {
        const filterContent = document.getElementById('filterContent');
        const toggleBtn = document.getElementById('toggleFilters');
        
        if (!filterContent || !toggleBtn) return;
        
        const isCollapsed = filterContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展開篩選器
            filterContent.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            localStorage.setItem('filtersCollapsed', 'false');
        } else {
            // 收合篩選器
            filterContent.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            localStorage.setItem('filtersCollapsed', 'true');
        }
    }
    
    // 顯示說明模態視窗
    showHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    // 隱藏說明模態視窗
    hideHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // 顯示篩選結果模態視窗
    showFilterResultModal() {
        const modal = document.getElementById('filterResultModal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    // 隱藏篩選結果模態視窗
    hideFilterResultModal() {
        const modal = document.getElementById('filterResultModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // 顯示空篩選結果提示
    showEmptyFilterResult(filters, nodeCount = 0, linkCount = 0) {
        // 生成篩選條件的描述
        const filterDescriptions = [];
        
        if (filters.sourceZone && filters.sourceZone.length > 0) {
            filterDescriptions.push(`<li><strong>來源區域:</strong> ${filters.sourceZone.join(', ')}</li>`);
        }
        
        if (filters.targetZone && filters.targetZone.length > 0) {
            filterDescriptions.push(`<li><strong>目標區域:</strong> ${filters.targetZone.join(', ')}</li>`);
        }
        
        if (filters.service && filters.service.length > 0) {
            filterDescriptions.push(`<li><strong>服務類型:</strong> ${filters.service.join(', ')}</li>`);
        }
        
        if (filters.sourceIP) {
            filterDescriptions.push(`<li><strong>來源IP:</strong> ${filters.sourceIP}</li>`);
        }
        
        if (filters.targetIP) {
            filterDescriptions.push(`<li><strong>目標IP:</strong> ${filters.targetIP}</li>`);
        }
        
        // 根據結果類型生成不同的提示訊息
        let message = '';
        if (nodeCount === 0 && linkCount === 0) {
            message = '沒有找到符合條件的節點和連線';
        } else if (nodeCount === 0) {
            message = '沒有找到符合條件的節點';
        } else if (linkCount === 0) {
            message = `找到 ${nodeCount} 個節點，但沒有符合條件的連線`;
        }
        
        // 更新彈窗內容
        const modal = document.getElementById('filterResultModal');
        const title = document.getElementById('filterResultTitle');
        const body = document.getElementById('filterResultBody');
        
        title.innerHTML = '篩選結果';
        
        let bodyContent = `
            <div class="filter-result-message">
                <p class="result-summary">${message}</p>
            </div>
        `;
        
        if (filterDescriptions.length > 0) {
            bodyContent += `
                <h4>目前篩選條件:</h4>
                <ul class="filter-conditions">
                    ${filterDescriptions.join('')}
                </ul>
            `;
        }
        
        bodyContent += `
            <div class="filter-suggestions">
                <h4>建議:</h4>
                <ul>
                    <li>檢查篩選條件是否正確</li>
                    <li>嘗試放寬篩選範圍設定</li>
                    <li>使用「清除篩選」重新開始</li>
                </ul>
            </div>
        `;
        
        body.innerHTML = bodyContent;
        
        // 顯示彈窗
        this.showFilterResultModal();
    }
    
    // 設置事件監聽器
    setupEventListeners() {
        // 深色模式切換
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 篩選器收合控制
        document.getElementById('toggleFilters')?.addEventListener('click', () => {
            this.toggleFilters();
        });
        
        // 說明按鈕
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.showHelpModal();
        });
        
        // 說明彈窗關閉
        document.querySelector('#helpModal .modal-close')?.addEventListener('click', () => {
            this.hideHelpModal();
        });
        
        document.getElementById('helpModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideHelpModal();
            }
        });
        
        // 篩選結果彈窗關閉
        document.querySelector('#filterResultModal .modal-close')?.addEventListener('click', () => {
            this.hideFilterResultModal();
        });
        
        document.getElementById('filterResultModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'filterResultModal') {
                this.hideFilterResultModal();
            }
        });
        
        // 詳細資訊面板關閉
        document.getElementById('closeDetails')?.addEventListener('click', () => {
            window.firewallGraph.interactionHandler.hideDetails();
        });
        
        // 視圖控制
        document.getElementById('showLabels')?.addEventListener('change', (e) => {
            window.firewallGraph.renderer.toggleLabels(e.target.checked);
        });
        
        document.getElementById('showArrows')?.addEventListener('change', (e) => {
            window.firewallGraph.renderer.toggleArrows(e.target.checked);
        });
        
        // 縮放控制
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            window.firewallGraph.renderer.zoomIn();
        });
        
        document.getElementById('zoomOut')?.addEventListener('click', () => {
            window.firewallGraph.renderer.zoomOut();
        });
        
        document.getElementById('fitView')?.addEventListener('click', () => {
            window.firewallGraph.renderer.fitToView();
        });
        
        // 匯出按鈕
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            window.firewallGraph.renderer.exportGraph();
        });
    }
}

window.UIController = UIController;