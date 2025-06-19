# 防火牆網路圖 - 模組化架構說明

## 📁 檔案結構

```
public/js/
├── utils.js                     # 工具函數模組
├── data-manager.js              # 數據管理模組
├── layout-manager.js            # 佈局管理模組
├── renderer.js                  # 渲染器模組
├── interaction-handler.js       # 互動處理模組
├── ui-controller.js             # UI控制模組
├── firewall-network-graph.js    # 主類模組
└── main.js                      # 主入口檔案
```

## 模組功能說明

### 1. `utils.js` - 工具函數模組
- **功能**：提供各種通用的輔助函數
- **主要內容**：
  - 字串雜湊函數
  - 隨機數生成器
  - 載入狀態控制
  - 錯誤訊息顯示
  - 統計資訊更新
  - 連線樣式工具函數

### 2. `data-manager.js` - 數據管理模組
- **功能**：負責數據的載入、篩選和管理
- **主要內容**：
  - API數據載入
  - 篩選選項載入和填充
  - 篩選條件應用
  - 資料更新檢測
  - 多重連線分析
  - 通知系統

### 3. `layout-manager.js` - 佈局管理模組
- **功能**：處理全局佈局和分區佈局
- **主要內容**：
  - 全局力導向佈局
  - 分區佈局算法
  - 節點位置計算
  - 分區約束力
  - 分區背景渲染
  - 顏色動態分配

### 4. `renderer.js` - 渲染器模組
- **功能**：負責SVG圖形的渲染和視覺效果
- **主要內容**：
  - SVG設置和初始化
  - 節點渲染
  - 連線渲染
  - 標籤渲染
  - 位置更新
  - 縮放控制
  - 圖表匯出

### 5. `interaction-handler.js` - 互動處理模組
- **功能**：處理用戶互動事件
- **主要內容**：
  - 節點點擊處理
  - 連線點擊處理
  - 懸停效果
  - 高亮顯示
  - 詳細資訊面板
  - 連線導航
  - 選擇狀態管理

### 6. `ui-controller.js` - UI控制模組
- **功能**：管理用戶介面控制項
- **主要內容**：
  - 主題切換
  - 篩選器控制
  - 模態視窗管理
  - 空結果提示
  - 事件監聽器設置
  - 本地存儲管理

### 7. `firewall-network-graph.js` - 主類模組
- **功能**：整合所有模組並提供主要API
- **主要內容**：
  - 模組整合
  - 初始化流程
  - 公共API
  - 狀態管理
  - 渲染協調
  - 事件分派

### 8. `main.js` - 主入口檔案
- **功能**：應用程式的初始化入口點
- **主要內容**：
  - 模組載入檢查
  - 全局實例創建
  - DOM就緒事件處理

## 依賴關係

1. `utils.js` - 基礎工具函數（無依賴）
2. `data-manager.js` - 依賴 `Utils`
3. `layout-manager.js` - 依賴 `Utils`
4. `renderer.js` - 依賴 `Utils`
5. `interaction-handler.js` - 依賴 `Utils`
6. `ui-controller.js` - 無直接依賴
7. `firewall-network-graph.js` - 依賴所有上述模組
8. `main.js` - 依賴 `FirewallNetworkGraph`

## 使用方式

在HTML中按順序載入所有模組：

```html
<!-- 載入模組化的JavaScript檔案 -->
<script src="js/utils.js"></script>
<script src="js/data-manager.js"></script>
<script src="js/layout-manager.js"></script>
<script src="js/renderer.js"></script>
<script src="js/interaction-handler.js"></script>
<script src="js/ui-controller.js"></script>
<script src="js/firewall-network-graph.js"></script>
<script src="js/main.js"></script>
```

應用程式會自動初始化，並在 `window.firewallGraph` 上創建全局實例。

## 維護指南

### 添加新功能
1. 確定功能所屬的模組
2. 在對應模組中添加新方法
3. 如需跨模組調用，通過主類進行協調

### 修改現有功能
1. 找到對應的模組檔案
2. 修改相關方法
3. 確保不會破壞模組間的接口

### 除錯技巧
1. 檢查瀏覽器控制台的模組載入日誌
2. 確認所有模組都已正確載入
3. 使用 `window.firewallGraph` 訪問主實例進行除錯