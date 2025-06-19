/* ==========================================================================
   防火牆網路圖主類
   ========================================================================== */

class FirewallNetworkGraph {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.simulation = null;
        this.fixNodesTimer = null;
        this.isRefreshing = false;
        
        // 圖表設定
        this.config = {
            width: 800,
            height: 600,
            nodeRadius: 12,
            linkDistance: 300, // 增加連線距離，讓節點更分散
            charge: -1500,     // 增加排斥力，讓節點更分散
            colors: {
                source: '#3b82f6',      // 藍色 - 來源節點
                target: '#10b981',      // 綠色 - 目標節點 
                both: '#8b5cf6',        // 紫色 - 雙向節點
                hover: '#f59e0b',       // 橙色 - 懸停
                selected: '#ef4444',    // 紅色 - 選中
                link: '#94a3b8',        // 灰色 - 連線
                linkHighlight: '#ef4444' // 紅色 - 高亮連線
            }
        };
        
        // 初始化各個模組
        this.dataManager = new DataManager();
        this.layoutManager = new LayoutManager(this.config);
        this.renderer = new Renderer(this.config);
        this.interactionHandler = new InteractionHandler();
        this.uiController = new UIController();
        
        this.init();
    }
    
    async init() {
        try {
            Utils.showLoading(true);
            await this.loadData();
            this.setupSVG();
            this.setupEventListeners();
            await this.loadFilterOptions();
            this.render();
            Utils.showLoading(false);
        } catch (error) {
            console.error('初始化失敗:', error);
            Utils.showError('載入數據失敗，請檢查防火牆數據文件');
            Utils.showLoading(false);
        }
    }
    
    // 載入數據
    async loadData() {
        try {
            const data = await this.dataManager.loadData();
            this.nodes = [...data.nodes];
            this.links = [...data.links];
            Utils.updateStats(data.stats);
        } catch (error) {
            console.error('載入數據錯誤:', error);
            throw error;
        }
    }
    
    // 載入篩選選項
    async loadFilterOptions() {
        await this.dataManager.loadFilterOptions();
    }
    
    // 設置SVG
    setupSVG() {
        const { svg, container } = this.renderer.setupSVG();
        this.svg = svg;
        this.container = container;
    }
    
    // 設置事件監聽器
    setupEventListeners() {
        // 重新載入按鈕
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refresh();
        });
        
        // 布局模式切換
        document.getElementById('layoutMode')?.addEventListener('change', (e) => {
            this.switchLayoutMode(e.target.value);
        });
        
        // 篩選控制
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // 響應式調整
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 設置UI控制器的事件監聽器
        this.uiController.setupEventListeners();
    }
    
    // 渲染圖表
    render() {
        // 清除之前的固定節點計時器
        if (this.fixNodesTimer) {
            clearTimeout(this.fixNodesTimer);
            this.fixNodesTimer = null;
        }
        
        // 如果沒有數據，清空圖表
        if (!this.nodes.length && !this.links.length) {
            this.clearGraph();
            return;
        }
        
        this.createSimulation();
        
        // 渲染圖形元素
        this.renderer.renderLinks(this.links, 
            (event, link) => this.interactionHandler.handleLinkClick(event, link),
            (event, link, isHover) => this.interactionHandler.handleLinkHover(event, link, isHover)
        );
        
        this.renderer.renderNodes(this.nodes,
            (event, node) => this.interactionHandler.handleNodeClick(event, node),
            (event, node, isHover) => this.interactionHandler.handleNodeHover(event, node, isHover)
        );
        
        this.renderer.renderLabels(this.nodes);
        
        this.simulation.alpha(0.8).restart();
        
        this.fixNodesTimer = setTimeout(() => {
            if (this.simulation) {
                this.simulation.stop();
                this.fixNodes();
                this.fixNodesTimer = null;
            }
        }, 4000);
    }
    
    // 創建模擬器
    createSimulation() {
        if (this.simulation) {
            this.simulation.stop();
        }

        // 分析多重連線
        this.dataManager.analyzeMultipleConnections(this.links);

        // 根據佈局模式創建不同的模擬器
        if (this.layoutManager.useZoneLayout) {
            this.simulation = this.layoutManager.createZoneBasedLayout(this.nodes, this.links, this.container);
        } else {
            this.simulation = this.layoutManager.createGlobalForceLayout(this.nodes, this.links, this.container);
        }

        this.simulation.on('tick', () => {
            this.renderer.updatePositions();
        });
    }
    
    // 固定所有節點位置
    fixNodes() {
        this.nodes.forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
        });
    }
    
    // 清空圖表
    clearGraph() {
        // 停止模擬器
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
        
        // 清除圖形元素
        this.renderer.clearGraph();
        
        // 清除選擇狀態
        this.interactionHandler.clearSelection();
        this.interactionHandler.hideDetails();
    }
    
    // 應用篩選器
    async applyFilters() {
        const filters = this.dataManager.getFilterValues();
        
        try {
            Utils.showLoading(true);
            const data = await this.dataManager.applyFilters(filters);
            
            // 檢查篩選結果是否為空
            if (data.nodes.length === 0 || data.links.length === 0) {
                // 清空圖表顯示
                this.nodes = [];
                this.links = [];
                Utils.updateStats(data.stats);
                this.render();
                
                // 顯示空結果提示
                this.uiController.showEmptyFilterResult(filters, data.nodes.length, data.links.length);
                Utils.showLoading(false);
                return;
            }
            
            this.nodes = [...data.nodes];
            this.links = [...data.links];
            
            Utils.updateStats(data.stats);
            this.render();
            Utils.showLoading(false);
        } catch (error) {
            console.error('篩選錯誤:', error);
            Utils.showError('篩選失敗，請檢查篩選條件');
            Utils.showLoading(false);
        }
    }
    
    // 清除篩選器
    clearFilters() {
        this.dataManager.clearFilters();
        
        // 清除分區顏色快取
        this.layoutManager.clearZoneColorCache();
        
        // 清除固定節點的計時器
        if (this.fixNodesTimer) {
            clearTimeout(this.fixNodesTimer);
            this.fixNodesTimer = null;
        }
        
        // 停止並清理舊的模擬器
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
        
        // 清除舊的分區背景
        this.container.selectAll('.zone-backgrounds').remove();
        
        // 重新加載原始數據
        const rawData = this.dataManager.getRawData();
        this.nodes = [...rawData.nodes];
        this.links = [...rawData.links];
        
        // 清理節點的固定位置，確保重新佈局有動畫效果
        this.nodes.forEach(node => {
            delete node.fx;
            delete node.fy;
            delete node.x;
            delete node.y;
            delete node.vx;
            delete node.vy;
        });
        
        // 清除選擇狀態
        this.interactionHandler.clearSelection();
        this.interactionHandler.hideDetails();
        
        Utils.updateStats(rawData.stats);
        this.render();
    }
    
    // 切換佈局模式
    switchLayoutMode(mode) {
        const wasUsingZoneLayout = this.layoutManager.useZoneLayout;
        const newMode = this.layoutManager.switchLayoutMode(mode);
        
        // 只有當模式真的改變時才重新佈局
        if (wasUsingZoneLayout !== newMode) {
            // 清除固定節點的計時器
            if (this.fixNodesTimer) {
                clearTimeout(this.fixNodesTimer);
                this.fixNodesTimer = null;
            }
            
            // 停止並清理舊的模擬器
            if (this.simulation) {
                this.simulation.stop();
                this.simulation = null;
            }
            
            // 清理節點的固定位置，確保重新佈局
            this.nodes.forEach(node => {
                delete node.fx;
                delete node.fy;
                delete node.x;
                delete node.y;
                delete node.vx;
                delete node.vy;
            });
            
            // 清除舊的分區背景
            this.container.selectAll('.zone-backgrounds').remove();
            
            // 重新渲染
            this.render();
        }
    }
    
    // 重新載入
    async refresh() {
        // 防止重複刷新
        if (this.isRefreshing) {
            return;
        }
        
        try {
            this.isRefreshing = true;
            Utils.showLoading(true);
            
            console.log('開始重新載入資料...');
            
            // 清除分區顏色快取
            this.layoutManager.clearZoneColorCache();
            
            // 清除固定節點的計時器
            if (this.fixNodesTimer) {
                clearTimeout(this.fixNodesTimer);
                this.fixNodesTimer = null;
            }
            
            // 停止並清理舊的模擬器
            if (this.simulation) {
                this.simulation.stop();
                this.simulation = null;
            }
            
            // 清理節點的固定位置，確保重新佈局
            if (this.nodes) {
                this.nodes.forEach(node => {
                    delete node.fx;
                    delete node.fy;
                    delete node.x;
                    delete node.y;
                    delete node.vx;
                    delete node.vy;
                });
            }
            
            // 清除舊的分區背景
            this.container.selectAll('.zone-backgrounds').remove();
            
            // 清除選擇狀態
            this.interactionHandler.clearSelection();
            this.interactionHandler.hideDetails();
            
            // 重新載入原始資料
            console.log('重新載入網路圖資料...');
            await this.loadData();
            
            // 重新載入篩選選項
            console.log('重新載入篩選選項...');
            await this.loadFilterOptions();
            
            // 清除篩選器狀態
            this.clearFilters();
            
            // 重新渲染
            console.log('重新渲染圖表...');
            this.render();
            
            console.log('資料重新載入完成！');
            Utils.showLoading(false);
            this.isRefreshing = false;
            
        } catch (error) {
            console.error('重新載入失敗:', error);
            Utils.showError('重新載入失敗: ' + error.message);
            Utils.showLoading(false);
            this.isRefreshing = false;
        }
    }
    
    // 響應式調整
    handleResize() {
        this.renderer.handleResize();
        
        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(
                    this.config.width / 2, 
                    this.config.height / 2
                ))
                .alpha(1)
                .restart();
        }
    }
    
    // 清除選擇（代理方法）
    clearSelection() {
        this.interactionHandler.clearSelection();
    }
    
    // 隱藏詳細資訊（代理方法）
    hideDetails() {
        this.interactionHandler.hideDetails();
    }
}

window.FirewallNetworkGraph = FirewallNetworkGraph; 