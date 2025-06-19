/* ==========================================================================
   工具函數模組
   ========================================================================== */

class Utils {
    // 雜湊函數
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    // 固定種子隨機數
    static seededRandom(seed) {
        let m = 0x80000000;
        let a = 1103515245;
        let c = 12345;       
        let state = seed ? seed : Math.floor(Math.random() * (m - 1));
        
        return function() {
            state = (a * state + c) % m;
            return state / (m - 1);
        };
    }
    
    // 顯示載入指示器
    static showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    }
    
    // 顯示錯誤訊息
    static showError(message) {
        alert(`錯誤: ${message}`);
    }
    
    // 更新統計資訊
    static updateStats(stats) {
        const nodeCount = document.getElementById('nodeCount');
        const linkCount = document.getElementById('linkCount');
        const zoneCount = document.getElementById('zoneCount');
        
        if (nodeCount) nodeCount.textContent = stats.totalNodes || 0;
        if (linkCount) linkCount.textContent = stats.totalLinks || 0;
        if (zoneCount) zoneCount.textContent = stats.totalZones || 0;
    }
    
    // 根據連線類型返回虛線樣式
    static getLinkDashArray(link) {
        if (!link.isMultiple) {
            return null;
        }
        
        // 如果有多個不同埠號，所有連線都使用虛線
        if (link.hasMultiplePorts) {
            return '5,5';
        }
        
        // 相同埠號的重複連線使用不同樣式
        const dashPatterns = [
            null,           // 第一條：實線
            '5,5',          // 第二條：短虛線
            '10,5',         // 第三條：長虛線
            '15,5,5,5',     // 第四條：點劃線
            '3,3'           // 第五條及以上：點線
        ];
        
        return dashPatterns[link.multipleIndex] || '2,2';
    }
    
    // 獲取連線顏色
    static getLinkColor(service) {
        return '#94a3b8';
    }
    
    // 獲取節點標籤
    static getNodeLabel(node) {
        const ip = node.ip || node.id;
        return ip.length > 15 ? ip.substring(0, 15) + '...' : ip;
    }
}

window.Utils = Utils; 