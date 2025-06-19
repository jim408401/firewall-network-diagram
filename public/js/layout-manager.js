/* ==========================================================================
   佈局管理模組
   ========================================================================== */

class LayoutManager {
    constructor(config) {
        this.config = config;
        this.useZoneLayout = false;
        this.zoneColorCache = new Map();
        this.availableColors = [
            { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.9)' },    // 藍色
            { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.9)' },   // 綠色
            { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.9)' },   // 紫色
            { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.9)' },   // 粉色
            { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.9)' },     // 紅色
            { bg: 'rgba(34, 211, 238, 0.15)', border: 'rgba(34, 211, 238, 0.9)' },   // 亮藍色
            { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.9)' },   // 橙色
            { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.9)' }   // 灰色
        ];
    }
    
    // 創建全局力導向佈局
    createGlobalForceLayout(nodes, links, container) {
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(this.config.linkDistance)
                .strength(0.2)
            )
            .force('charge', d3.forceManyBody()
                .strength(this.config.charge)
            )
            .force('center', d3.forceCenter(
                this.config.width / 2, 
                this.config.height / 2
            ))
            .force('collision', d3.forceCollide()
                .radius(this.config.nodeRadius * 3)
            )
            .force('radial', d3.forceRadial()
                .radius(Math.min(this.config.width, this.config.height) * 0.4)
                .x(this.config.width / 2)
                .y(this.config.height / 2)
                .strength(0.2)
            );

        simulation.randomSource(Utils.seededRandom(42));
        this.setInitialPositions(nodes);
        
        return simulation;
    }
    
    // 創建分區佈局
    createZoneBasedLayout(nodes, links, container) {
        // 按分區分組節點
        const zoneGroups = this.groupNodesByZone(nodes);
        const zones = Object.keys(zoneGroups);
        
        if (zones.length === 0) {
            return this.createGlobalForceLayout(nodes, links, container);
        }
        
        // 計算每個分區的布局區域
        const zoneAreas = this.calculateZoneAreas(zones);
        
        // 為每個分區設置初始位置
        this.setZoneInitialPositions(zoneGroups, zoneAreas);
        
        // 創建全局模擬器，但使用分區約束
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(this.config.linkDistance * 0.5)
                .strength(0.4)
            )
            .force('charge', d3.forceManyBody()
                .strength(this.config.charge * 0.3)
            )
            .force('collision', d3.forceCollide()
                .radius(this.config.nodeRadius * 2.5)
            )
            .force('zone', this.createZoneConstraintForce(zoneGroups, zoneAreas))
            .force('zoneCenter', this.createZoneCenterForce(zoneGroups, zoneAreas));

        simulation.randomSource(Utils.seededRandom(42));
        
        this.renderZoneBackgrounds(container, zoneAreas);
        
        return simulation;
    }
    
    // 按分區分組節點
    groupNodesByZone(nodes) {
        const groups = {};
        nodes.forEach(node => {
            const zone = node.zone || '未知區域';
            if (!groups[zone]) {
                groups[zone] = [];
            }
            groups[zone].push(node);
        });
        return groups;
    }
    
    // 計算每個分區的布局區域
    calculateZoneAreas(zones) {
        const zoneCount = zones.length;
        const areas = {};
        const padding = 40;
        
        // 根據分區數量決定布局方式
        if (zoneCount <= 2) {
            // 2個分區：左右分佈
            const areaWidth = (this.config.width - padding * 3) / 2;
            const areaHeight = this.config.height - padding * 2;
            
            zones.forEach((zone, index) => {
                areas[zone] = {
                    x: padding + index * (areaWidth + padding),
                    y: padding,
                    width: areaWidth,
                    height: areaHeight,
                    centerX: padding + index * (areaWidth + padding) + areaWidth / 2,
                    centerY: padding + areaHeight / 2
                };
            });
        } else if (zoneCount <= 4) {
            // 4個分區：2x2網格
            const cols = 2;
            const rows = Math.ceil(zoneCount / cols);
            const areaWidth = (this.config.width - padding * (cols + 1)) / cols;
            const areaHeight = (this.config.height - padding * (rows + 1)) / rows;
            
            zones.forEach((zone, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                
                areas[zone] = {
                    x: padding + col * (areaWidth + padding),
                    y: padding + row * (areaHeight + padding),
                    width: areaWidth,
                    height: areaHeight,
                    centerX: padding + col * (areaWidth + padding) + areaWidth / 2,
                    centerY: padding + row * (areaHeight + padding) + areaHeight / 2
                };
            });
        } else {
            // 多個分區：動態網格
            const cols = Math.ceil(Math.sqrt(zoneCount));
            const rows = Math.ceil(zoneCount / cols);
            const areaWidth = (this.config.width - padding * (cols + 1)) / cols;
            const areaHeight = (this.config.height - padding * (rows + 1)) / rows;
            
            zones.forEach((zone, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                
                areas[zone] = {
                    x: padding + col * (areaWidth + padding),
                    y: padding + row * (areaHeight + padding),
                    width: areaWidth,
                    height: areaHeight,
                    centerX: padding + col * (areaWidth + padding) + areaWidth / 2,
                    centerY: padding + row * (areaHeight + padding) + areaHeight / 2
                };
            });
        }
        
        return areas;
    }
    
    // 為分區節點設置初始位置
    setZoneInitialPositions(zoneGroups, zoneAreas) {
        Object.entries(zoneGroups).forEach(([zone, nodes]) => {
            const area = zoneAreas[zone];
            const nodeCount = nodes.length;
            
            if (nodeCount === 1) {
                // 單個節點放在分區中心
                nodes[0].x = area.centerX;
                nodes[0].y = area.centerY;
            } else {
                // 多個節點在分區內排成圓形
                const radius = Math.min(area.width, area.height) * 0.3;
                nodes.forEach((node, index) => {
                    // 使用節點IP的哈希值確保位置一致性
                    const ipHash = Utils.hashString(node.ip || node.id);
                    const angle = (2 * Math.PI * (ipHash % 1000)) / 1000 + 
                                 (2 * Math.PI * index) / nodeCount;
                    
                    node.x = area.centerX + radius * Math.cos(angle);
                    node.y = area.centerY + radius * Math.sin(angle);
                    
                    // 確保節點在分區範圍內
                    node.x = Math.max(area.x + this.config.nodeRadius * 2, 
                             Math.min(area.x + area.width - this.config.nodeRadius * 2, node.x));
                    node.y = Math.max(area.y + this.config.nodeRadius * 2, 
                             Math.min(area.y + area.height - this.config.nodeRadius * 2, node.y));
                    
                    node.vx = 0;
                    node.vy = 0;
                });
            }
        });
    }
    
    // 創建分區約束力
    createZoneConstraintForce(zoneGroups, zoneAreas) {
        return (alpha) => {
            Object.entries(zoneGroups).forEach(([zone, nodes]) => {
                const area = zoneAreas[zone];
                nodes.forEach(node => {
                    const margin = this.config.nodeRadius * 3;
                    const minX = area.x + margin;
                    const maxX = area.x + area.width - margin;
                    const minY = area.y + margin;
                    const maxY = area.y + area.height - margin;
                    
                    const constraintStrength = 0.8;
                    
                    if (node.x < minX) {
                        node.vx += (minX - node.x) * alpha * constraintStrength;
                        node.x = Math.max(node.x, minX - 5);
                    } else if (node.x > maxX) {
                        node.vx += (maxX - node.x) * alpha * constraintStrength;
                        node.x = Math.min(node.x, maxX + 5);
                    }
                    
                    if (node.y < minY) {
                        node.vy += (minY - node.y) * alpha * constraintStrength;
                        node.y = Math.max(node.y, minY - 5);
                    } else if (node.y > maxY) {
                        node.vy += (maxY - node.y) * alpha * constraintStrength;
                        node.y = Math.min(node.y, maxY + 5);
                    }
                });
            });
        };
    }
    
    // 創建分區中心吸引力
    createZoneCenterForce(zoneGroups, zoneAreas) {
        return (alpha) => {
            Object.entries(zoneGroups).forEach(([zone, nodes]) => {
                const area = zoneAreas[zone];
                nodes.forEach(node => {
                    const dx = area.centerX - node.x;
                    const dy = area.centerY - node.y;
                    const strength = 0.1;
                    
                    node.vx += dx * strength * alpha;
                    node.vy += dy * strength * alpha;
                });
            });
        };
    }
    
    // 渲染分區背景
    renderZoneBackgrounds(container, zoneAreas) {
        container.selectAll('.zone-background').remove();
        
        const zoneLayer = container.insert('g', '.links-layer')
            .attr('class', 'zone-backgrounds');
        
        // 使用動態顏色分配系統
        const { zoneColors, zoneBorderColors } = this.getAllZoneColors(Object.keys(zoneAreas));
        
        Object.entries(zoneAreas).forEach(([zone, area]) => {
            const zoneGroup = zoneLayer.append('g')
                .attr('class', 'zone-background')
                .attr('data-zone', zone);
            
            // 背景矩形
            zoneGroup.append('rect')
                .attr('x', area.x)
                .attr('y', area.y)
                .attr('width', area.width)
                .attr('height', area.height)
                .attr('fill', zoneColors[zone])
                .attr('stroke', zoneBorderColors[zone])
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '8,4')
                .attr('rx', 12)
                .attr('ry', 12);
            
            // 分區標籤
            zoneGroup.append('text')
                .attr('x', area.x + 15)
                .attr('y', area.y + 25)
                .attr('class', 'zone-label')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .style('fill', zoneBorderColors[zone])
                .style('pointer-events', 'none')
                .text(zone);
        });
    }
    
    // 設定節點的初始位置（圓形排列）
    setInitialPositions(nodes) {
        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;
        const radius = Math.min(this.config.width, this.config.height) * 0.4;
        
        nodes.forEach((node, index) => {
            // 使用節點的IP地址作為固定種子，而不是索引，確保相同IP總是在相同位置
            const ipHash = Utils.hashString(node.ip || node.id);
            
            // 使用哈希值來確定固定的角度，確保每次都一樣
            const angle = (2 * Math.PI * (ipHash % 1000)) / 1000;
            
            const radiusOffset = ((ipHash % 100) - 50);
            const angleOffset = ((ipHash >> 10) % 40 - 20) * Math.PI / 180;
            
            const finalRadius = radius + radiusOffset;
            const finalAngle = angle + angleOffset;
            
            node.x = centerX + finalRadius * Math.cos(finalAngle);
            node.y = centerY + finalRadius * Math.sin(finalAngle);
            
            node.x = Math.max(this.config.nodeRadius * 3, 
                     Math.min(this.config.width - this.config.nodeRadius * 3, node.x));
            node.y = Math.max(this.config.nodeRadius * 3, 
                     Math.min(this.config.height - this.config.nodeRadius * 3, node.y));
            
            node.vx = 0;
            node.vy = 0;
        });
    }
    
    // 動態分配分區顏色
    assignZoneColor(zoneName) {
        if (this.zoneColorCache.has(zoneName)) {
            return this.zoneColorCache.get(zoneName);
        }
        
        // 預設的分區顏色（優先使用）
        const predefinedColors = {
            'Server Farm': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.9)' },
            'Intranet RD': { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.9)' },
            'Intranet Office': { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.9)' },
            '未知區域': { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.9)' }
        };
        
        let color;
        
        if (predefinedColors[zoneName]) {
            color = predefinedColors[zoneName];
        } else {
            const hash = Utils.hashString(zoneName);
            const colorIndex = hash % (this.availableColors.length - 1);
            color = this.availableColors[colorIndex];
        }
        
        this.zoneColorCache.set(zoneName, color);
        
        return color;
    }
    
    // 獲取所有分區的顏色映射
    getAllZoneColors(zones) {
        const zoneColors = {};
        const zoneBorderColors = {};
        
        zones.forEach(zone => {
            const colors = this.assignZoneColor(zone);
            zoneColors[zone] = colors.bg;
            zoneBorderColors[zone] = colors.border;
        });
        
        return { zoneColors, zoneBorderColors };
    }
    
    // 切換佈局模式
    switchLayoutMode(mode) {
        this.useZoneLayout = (mode === 'zone');
        return this.useZoneLayout;
    }
    
    // 清除分區顏色快取
    clearZoneColorCache() {
        this.zoneColorCache.clear();
    }
    
    // 獲取當前佈局模式
    getLayoutMode() {
        return this.useZoneLayout ? 'zone' : 'global';
    }
}

window.LayoutManager = LayoutManager; 