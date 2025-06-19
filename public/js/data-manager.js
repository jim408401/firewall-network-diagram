/* ==========================================================================
   數據管理模組
   ========================================================================== */

class DataManager {
    constructor() {
        this.rawData = [];
        this.filteredData = null;
        this.lastDataTimestamp = null;
        this.dataCheckInterval = null;
    }
    
    // 載入數據
    async loadData() {
        try {
            const response = await fetch('/api/network-graph');
            if (!response.ok) {
                throw new Error('載入數據失敗');
            }
            const data = await response.json();
            
            this.rawData = data;
            this.lastDataTimestamp = Date.now();
            
            // 啟動定期檢查（每30秒檢查一次）
            if (!this.dataCheckInterval) {
                this.startDataUpdateCheck();
            }
            
            return data;
        } catch (error) {
            console.error('載入數據錯誤:', error);
            throw error;
        }
    }
    
    // 載入篩選選項
    async loadFilterOptions() {
        try {
            const response = await fetch('/api/filter-options');
            const options = await response.json();
            
            this.populateFilterSelect('sourceZoneFilter', options.sourceZones);
            this.populateFilterSelect('targetZoneFilter', options.targetZones);
            this.populateFilterSelect('serviceFilter', options.services);
            
            return options;
        } catch (error) {
            console.error('載入篩選選項失敗:', error);
            return null;
        }
    }
    
    // 填充篩選選項
    populateFilterSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // 清空現有選項（保留第一個"全部"選項）
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // 添加新選項
        options.forEach(option => {
            if (option) {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            }
        });
    }
    
    // 啟動資料更新檢查
    startDataUpdateCheck() {
        this.dataCheckInterval = setInterval(async () => {
            await this.checkForDataUpdates();
        }, 30000);
    }
    
    // 檢查資料是否有更新
    async checkForDataUpdates() {
        try {
            const response = await fetch('/api/network-graph');
            if (!response.ok) return;
            
            const data = await response.json();
            
            // 簡單的檢查：比較節點和連線數量，以及分區數量
            const currentStats = {
                nodes: this.rawData.nodes.length,
                links: this.rawData.links.length,
                zones: this.rawData.zones.length
            };
            
            const newStats = {
                nodes: data.nodes.length,
                links: data.links.length,
                zones: data.zones.length
            };
            
            // 如果統計數據不同，或者分區內容不同，提示更新
            const statsChanged = JSON.stringify(currentStats) !== JSON.stringify(newStats);
            const zonesChanged = JSON.stringify(this.rawData.zones.sort()) !== JSON.stringify(data.zones.sort());
            
            if (statsChanged || zonesChanged) {
                this.showDataUpdateNotification();
                // 停止檢查，避免重複提示
                clearInterval(this.dataCheckInterval);
                this.dataCheckInterval = null;
            }
        } catch (error) {
            // 檢查失敗，忽略錯誤
        }
    }
    
    // 顯示資料更新通知
    showDataUpdateNotification() {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = 'data-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-text">偵測到資料有更新，是否要重新載入？</span>
                <div class="notification-actions">
                    <button class="notification-btn refresh-btn">重新載入</button>
                    <button class="notification-btn dismiss-btn">忽略</button>
                </div>
            </div>
        `;
        
        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-primary);
            border: 2px solid var(--accent-color);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // 添加事件監聽器
        notification.querySelector('.refresh-btn').addEventListener('click', () => {
            window.firewallGraph.refresh();
            document.body.removeChild(notification);
        });
        
        notification.querySelector('.dismiss-btn').addEventListener('click', () => {
            document.body.removeChild(notification);
            // 重新啟動檢查
            this.startDataUpdateCheck();
        });
        
        // 添加到頁面
        document.body.appendChild(notification);
        
        // 10秒後自動消失
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
                // 重新啟動檢查
                this.startDataUpdateCheck();
            }
        }, 10000);
    }
    
    // 應用篩選器
    async applyFilters(filters) {
        try {
            const response = await fetch('/api/network-graph/filtered', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filters })
            });
            
            if (!response.ok) {
                throw new Error('篩選失敗');
            }
            
            const data = await response.json();
            this.filteredData = data;
            
            return data;
        } catch (error) {
            console.error('篩選錯誤:', error);
            throw error;
        }
    }
    
    // 獲取篩選值
    getFilterValues() {
        const filters = {};
        
        const sourceZoneFilter = document.getElementById('sourceZoneFilter');
        const targetZoneFilter = document.getElementById('targetZoneFilter');
        const serviceFilter = document.getElementById('serviceFilter');
        const sourceIPFilter = document.getElementById('sourceIPFilter');
        const targetIPFilter = document.getElementById('targetIPFilter');
        
        if (sourceZoneFilter) {
            const selected = Array.from(sourceZoneFilter.selectedOptions)
                .map(option => option.value)
                .filter(value => value);
            if (selected.length > 0) filters.sourceZone = selected;
        }
        
        if (targetZoneFilter) {
            const selected = Array.from(targetZoneFilter.selectedOptions)
                .map(option => option.value)
                .filter(value => value);
            if (selected.length > 0) filters.targetZone = selected;
        }
        
        if (serviceFilter) {
            const selected = Array.from(serviceFilter.selectedOptions)
                .map(option => option.value)
                .filter(value => value);
            if (selected.length > 0) filters.service = selected;
        }
        
        if (sourceIPFilter && sourceIPFilter.value.trim()) {
            filters.sourceIP = sourceIPFilter.value.trim();
        }
        
        if (targetIPFilter && targetIPFilter.value.trim()) {
            filters.targetIP = targetIPFilter.value.trim();
        }
        
        return filters;
    }
    
    // 清除篩選器
    clearFilters() {
        // 清除所有篩選器
        document.getElementById('sourceZoneFilter')?.selectedOptions && 
            Array.from(document.getElementById('sourceZoneFilter').selectedOptions)
                .forEach(option => option.selected = false);
        
        document.getElementById('targetZoneFilter')?.selectedOptions && 
            Array.from(document.getElementById('targetZoneFilter').selectedOptions)
                .forEach(option => option.selected = false);
        
        document.getElementById('serviceFilter')?.selectedOptions && 
            Array.from(document.getElementById('serviceFilter').selectedOptions)
                .forEach(option => option.selected = false);
        
        const sourceIPFilter = document.getElementById('sourceIPFilter');
        if (sourceIPFilter) sourceIPFilter.value = '';
        
        const targetIPFilter = document.getElementById('targetIPFilter');
        if (targetIPFilter) targetIPFilter.value = '';
        
        // 清除篩選數據
        this.filteredData = null;
    }
    
    // 分析多重連線並標記樣式
    analyzeMultipleConnections(links) {
        // 建立連線對應的計數器和埠號資訊
        const connectionGroups = new Map();
        
        // 統計每個連線對的數量和埠號
        links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            // 建立連線鍵值（確保方向一致性）
            const connectionKey = sourceId < targetId ? 
                `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
            
            if (!connectionGroups.has(connectionKey)) {
                connectionGroups.set(connectionKey, []);
            }
            
            connectionGroups.get(connectionKey).push(link);
        });
        
        // 為每個連線組中的連線設定樣式和埠號資訊
        connectionGroups.forEach((links, connectionKey) => {
            const count = links.length;
            
            // 收集所有埠號和服務
            const allPorts = [...new Set(links.map(l => l.record?.targetPort || '未知'))];
            const allServices = [...new Set(links.map(l => l.record?.service || '未知'))];
            const hasMultiplePorts = allPorts.length > 1;
            
            links.forEach((link, index) => {
                if (count > 1) {
                    // 多條連線時設定樣式
                    link.isMultiple = true;
                    link.multipleIndex = index;
                    link.multipleTotal = count;
                    link.hasMultiplePorts = hasMultiplePorts;
                    
                    // 添加所有埠號和服務資訊
                    link.allPorts = allPorts;
                    link.allServices = allServices;
                    link.currentPort = link.record?.targetPort || '未知';
                    link.currentService = link.record?.service || '未知';
                } else {
                    // 單條連線
                    link.isMultiple = false;
                    link.hasMultiplePorts = false;
                }
            });
        });
    }
    
    // 獲取原始數據
    getRawData() {
        return this.rawData;
    }
    
    // 獲取篩選後的數據
    getFilteredData() {
        return this.filteredData;
    }
    
    // 停止數據檢查
    stopDataUpdateCheck() {
        if (this.dataCheckInterval) {
            clearInterval(this.dataCheckInterval);
            this.dataCheckInterval = null;
        }
    }
}

window.DataManager = DataManager; 