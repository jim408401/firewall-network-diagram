/* ==========================================================================
   渲染器模組
   ========================================================================== */

class Renderer {
    constructor(config) {
        this.config = config;
        this.svg = null;
        this.container = null;
        this.zoomBehavior = null;
        this.showArrows = true;
    }
    
    // 設置SVG
    setupSVG() {
        const containerElement = d3.select('#networkGraph');
        const rect = containerElement.node().getBoundingClientRect();
        
        this.config.width = rect.width;
        this.config.height = rect.height;
        
        // 清除舊的 SVG
        containerElement.selectAll('*').remove();
        
        // 創建新的 SVG
        this.svg = containerElement
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
        
        // 添加縮放行為
        this.zoomBehavior = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.container.attr('transform', event.transform);
            });
        
        this.svg.call(this.zoomBehavior);
        
        // 添加背景點擊事件來清除選擇
        this.svg.on('click', (event) => {
            // 如果點擊的是SVG背景（不是節點或連線），則清除選擇
            if (event.target === this.svg.node()) {
                window.firewallGraph.clearSelection();
                window.firewallGraph.hideDetails();
            }
        });
        
        // 創建主容器
        this.container = this.svg.append('g').attr('class', 'main-container');
        
        // 創建圖層
        this.container.append('g').attr('class', 'links-layer');
        this.container.append('g').attr('class', 'nodes-layer');
        this.container.append('g').attr('class', 'labels-layer');
        
        // 添加箭頭標記
        this.setupArrowMarkers();
        
        return { svg: this.svg, container: this.container };
    }
    
    // 設置箭頭標記
    setupArrowMarkers() {
        if (this.svg.select('defs').empty()) {
            const defs = this.svg.append('defs');
            
            // 一般箭頭
            defs.append('marker')
                .attr('id', 'arrowhead')
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 15)
                .attr('refY', 0)
                .attr('orient', 'auto')
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('xoverflow', 'visible')
                .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', '#94a3b8');
            
            // 選中狀態的箭頭（紅色）
            defs.append('marker')
                .attr('id', 'arrowhead-selected')
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 15)
                .attr('refY', 0)
                .attr('orient', 'auto')
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('xoverflow', 'visible')
                .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', this.config.colors.linkHighlight);
        }
    }
    
    // 渲染連線
    renderLinks(links, onLinkClick, onLinkHover) {
        const linksLayer = this.container.select('.links-layer');
        
        // 移除舊的線段和點擊區域
        linksLayer.selectAll('.link').remove();
        linksLayer.selectAll('.link-clickarea').remove();
        
        // 為每條連線創建一個組
        const linkGroups = linksLayer
            .selectAll('.link-group')
            .data(links, d => d.id);
        
        linkGroups.exit().remove();
        
        const newLinkGroups = linkGroups.enter()
            .append('g')
            .attr('class', 'link-group');
        
        const allLinkGroups = newLinkGroups.merge(linkGroups);
        
        // 添加透明的較粗點擊區域
        const clickAreas = allLinkGroups.selectAll('.link-clickarea')
            .data(d => [d]);
        
        clickAreas.exit().remove();
        
        const newClickAreas = clickAreas.enter()
            .append('line')
            .attr('class', 'link-clickarea')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 12)
            .style('cursor', 'pointer');
        
        const allClickAreas = newClickAreas.merge(clickAreas);
        
        // 添加實際顯示的線段
        const visualLinks = allLinkGroups.selectAll('.link')
            .data(d => [d]);
        
        visualLinks.exit().remove();
        
        const newVisualLinks = visualLinks.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', d => d.isMultiple ? 2 : 1.5)
            .attr('stroke-opacity', 0.8)
            .attr('stroke-dasharray', d => Utils.getLinkDashArray(d))
            .style('pointer-events', 'none');
        
        const allVisualLinks = newVisualLinks.merge(visualLinks);
        
        // 設置視覺線段的箭頭、顏色和虛線樣式
        allVisualLinks
            .attr('marker-end', this.showArrows ? 'url(#arrowhead)' : null)
            .attr('stroke', d => Utils.getLinkColor(d.service))
            .attr('stroke-width', d => d.isMultiple ? 2 : 1.5)
            .attr('stroke-dasharray', d => Utils.getLinkDashArray(d));
        
        // 為點擊區域綁定事件
        allClickAreas
            .on('click', (event, d) => {
                event.stopPropagation();
                onLinkClick(event, d);
            })
            .on('mouseover', (event, d) => {
                onLinkHover(event, d, true);
            })
            .on('mouseout', (event, d) => {
                onLinkHover(event, d, false);
            });
    }
    
    // 渲染節點  
    renderNodes(nodes, onNodeClick, onNodeHover) {
        const nodesLayer = this.container.select('.nodes-layer');
        
        const nodeElements = nodesLayer
            .selectAll('.node')
            .data(nodes, d => d.id);
        
        nodeElements.exit().remove();
        
        const newNodes = nodeElements.enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', this.config.nodeRadius);
        
        const allNodes = newNodes.merge(nodeElements);
        
        allNodes
            .attr('fill', d => this.getNodeColor(d, nodes))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('click', (event, d) => {
                event.stopPropagation();
                onNodeClick(event, d);
            })
            .on('mouseover', (event, d) => {
                onNodeHover(event, d, true);
            })
            .on('mouseout', (event, d) => {
                onNodeHover(event, d, false);
            });
    }
    
    // 渲染標籤
    renderLabels(nodes) {
        const labelsLayer = this.container.select('.labels-layer');
        
        const labels = labelsLayer
            .selectAll('.node-label')
            .data(nodes, d => d.id);
        
        labels.exit().remove();
        
        const newLabels = labels.enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .style('font-weight', '500')
            .style('pointer-events', 'none')
            .style('fill', 'var(--text-primary)');
        
        const allLabels = newLabels.merge(labels);
        
        allLabels.text(d => Utils.getNodeLabel(d));
    }
    
    // 更新位置
    updatePositions() {
        // 更新連線位置（包括視覺線段和點擊區域）
        this.container.selectAll('.link, .link-clickarea')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        // 更新節點位置
        this.container.selectAll('.node')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        // 更新標籤位置
        this.container.selectAll('.node-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y + this.config.nodeRadius + 12);
    }
    
    // 獲取節點顏色
    getNodeColor(node, allNodes) {
        // 檢查節點是否同時作為來源和目標
        const links = window.firewallGraph.links; // 從主實例獲取links
        const isSource = links.some(link => link.source.id === node.id);
        const isTarget = links.some(link => link.target.id === node.id);
        
        if (isSource && isTarget) {
            return this.config.colors.both; // 雙向節點
        } else if (isSource) {
            return this.config.colors.source; // 來源節點
        } else {
            return this.config.colors.target; // 目標節點
        }
    }
    
    // 清空圖表
    clearGraph() {
        if (this.container) {
            this.container.select('.links-layer').selectAll('*').remove();
            this.container.select('.nodes-layer').selectAll('*').remove();
            this.container.select('.labels-layer').selectAll('*').remove();
        }
    }
    
    // 縮放控制
    zoomIn() {
        this.svg.transition().duration(300)
            .call(this.zoomBehavior.scaleBy, 1.5);
    }
    
    zoomOut() {
        this.svg.transition().duration(300)
            .call(this.zoomBehavior.scaleBy, 1 / 1.5);
    }
    
    fitToView() {
        const bounds = this.container.node().getBBox();
        const fullWidth = this.config.width;
        const fullHeight = this.config.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        
        if (width === 0 || height === 0) return;
        
        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.9;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        
        this.svg.transition().duration(750)
            .call(this.zoomBehavior.transform, d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale));
    }
    
    // 切換標籤顯示
    toggleLabels(show) {
        this.container.select('.labels-layer')
            .style('display', show ? 'block' : 'none');
    }
    
    // 切換箭頭顯示
    toggleArrows(show) {
        this.showArrows = show; // 儲存箭頭顯示狀態
        this.container.selectAll('.link')
            .attr('marker-end', show ? 'url(#arrowhead)' : null);
    }
    
    // 處理響應式調整
    handleResize() {
        const containerElement = d3.select('#networkGraph');
        const rect = containerElement.node().getBoundingClientRect();
        
        this.config.width = rect.width;
        this.config.height = rect.height;
        
        if (this.svg) {
            this.svg.attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
        }
    }
    
    // 匯出圖表
    exportGraph() {
        // 創建一個臨時的 SVG 來匯出
        const svgElement = this.svg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        
        // 創建下載連結
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `防火牆網路圖_${new Date().toISOString().split('T')[0]}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

window.Renderer = Renderer; 