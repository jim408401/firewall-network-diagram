/* ==========================================================================
   主入口檔案
   ========================================================================== */

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Utils !== 'undefined' && 
        typeof DataManager !== 'undefined' && 
        typeof LayoutManager !== 'undefined' && 
        typeof Renderer !== 'undefined' && 
        typeof InteractionHandler !== 'undefined' && 
        typeof UIController !== 'undefined' && 
        typeof FirewallNetworkGraph !== 'undefined') {
        
        window.firewallGraph = new FirewallNetworkGraph();
        
        console.log('應用程式已初始化');
    } else {
        console.error('模組載入失敗，請檢查所有JavaScript檔案是否正確載入');
    }
}); 