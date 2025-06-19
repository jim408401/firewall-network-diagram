/* ==========================================================================
   互動處理模組
   ========================================================================== */

class InteractionHandler {
    constructor() {
        this.selectedNode = null;
        this.selectedLink = null;
        this.currentLinkGroup = null;
        this.currentSelectedLinkIndex = null;
    }
    
    // 處理節點點擊
    handleNodeClick(event, node) {
        // 清除之前的選擇
        this.clearSelection();
        
        // 設置當前選擇
        this.selectedNode = node;
        this.highlightNode(node);
        this.highlightConnectedNodes(node);
        
        // 顯示詳細資訊
        this.showNodeDetails(node);
    }
    
    // 處理連線點擊
    handleLinkClick(event, link) {
        // 清除之前的選擇
        this.clearSelection();
        
        // 設置當前選擇
        this.selectedLink = link;
        this.highlightLink(link);
        this.highlightLinkNodes(link);
        
        // 顯示詳細資訊
        this.showLinkDetails(link);
    }
    
    // 處理節點懸停
    handleNodeHover(event, node, isHover) {
        if (this.selectedNode || this.selectedLink) {
            return;
        }
        
        const container = window.firewallGraph.renderer.container;
        const links = window.firewallGraph.links;
        const config = window.firewallGraph.config;
        
        if (isHover) {
            // 找出與懸浮節點相關的所有連線對（考慮雙向連線）
            const relatedConnections = new Set();
            links.forEach(link => {
                if (link.source.id === node.id || link.target.id === node.id) {
                    relatedConnections.add(link.id);
                    const reverseLink = links.find(l => 
                        l.source.id === link.target.id && l.target.id === link.source.id && l.id !== link.id
                    );
                    if (reverseLink) {
                        relatedConnections.add(reverseLink.id);
                    }
                }
            });

            // 高亮相關連線（包括雙向連線）
            container.selectAll('.link')
                .style('opacity', d => 
                    relatedConnections.has(d.id) ? 1 : 0.3
                )
                .attr('stroke-width', d =>
                    relatedConnections.has(d.id) ? 3 : 1.5
                )
                .attr('stroke', d => 
                    relatedConnections.has(d.id) ? 
                    config.colors.linkHighlight : config.colors.link
                )
                .attr('marker-end', d => {
                    if (!window.firewallGraph.renderer.showArrows) return null;
                    return relatedConnections.has(d.id) ? 
                        'url(#arrowhead-selected)' : 'url(#arrowhead)';
                });
            
            // 同時處理點擊區域
            container.selectAll('.link-clickarea')
                .style('opacity', d => 
                    relatedConnections.has(d.id) ? 1 : 0.3
                );
            
            // 高亮節點本身
            container.selectAll('.node')
                .style('opacity', d => {
                    if (d.id === node.id) return 1;
                    const isConnected = links.some(link => 
                        (link.source.id === node.id && link.target.id === d.id) ||
                        (link.target.id === node.id && link.source.id === d.id)
                    );
                    return isConnected ? 1 : 0.3;
                })
                .attr('stroke-width', d => d.id === node.id ? 3 : 2);
        } else {
            // 恢復原狀
            container.selectAll('.link')
                .style('opacity', 1)
                .attr('stroke-width', 1.5)
                .attr('stroke', '#94a3b8')
                .attr('marker-end', window.firewallGraph.renderer.showArrows ? 'url(#arrowhead)' : null);
            
            container.selectAll('.link-clickarea')
                .style('opacity', 1);
            
            container.selectAll('.node')
                .style('opacity', 1)
                .attr('stroke-width', 2);
        }
    }
    
    // 處理連線懸停
    handleLinkHover(event, link, isHover) {
        // 如果已經有選中的節點或連線，不執行懸停效果
        if (this.selectedNode || this.selectedLink) {
            return;
        }
        
        const container = window.firewallGraph.renderer.container;
        const links = window.firewallGraph.links;
        const config = window.firewallGraph.config;
        
        if (isHover) {
            // 找出雙向連線對
            const relatedConnections = new Set([link.id]);
            const reverseLink = links.find(l => 
                l.source.id === link.target.id && l.target.id === link.source.id && l.id !== link.id
            );
            if (reverseLink) {
                relatedConnections.add(reverseLink.id);
            }

            // 高亮當前連線（包括雙向連線）
            container.selectAll('.link')
                .attr('stroke', d => relatedConnections.has(d.id) ? config.colors.linkHighlight : '#94a3b8')
                .attr('stroke-width', d => relatedConnections.has(d.id) ? 3 : 1)
                .attr('marker-end', d => {
                    if (!window.firewallGraph.renderer.showArrows) return null; // 如果箭頭被隱藏，則不顯示
                    return relatedConnections.has(d.id) ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
                })
                .style('opacity', d => relatedConnections.has(d.id) ? 1 : 0.2);
            
            // 同時更新點擊區域的透明度
            container.selectAll('.link-clickarea')
                .style('opacity', d => relatedConnections.has(d.id) ? 1 : 0.2);
            
            // 高亮連線的兩個端點
            container.selectAll('.node')
                .style('opacity', d => 
                    (d.id === link.source.id || d.id === link.target.id) ? 1 : 0.3
                )
                .attr('stroke-width', d => 
                    (d.id === link.source.id || d.id === link.target.id) ? 3 : 2
                );
        } else {
            // 恢復原狀
            container.selectAll('.link')
                .attr('stroke', '#94a3b8')
                .attr('stroke-width', 1.5)
                .attr('marker-end', window.firewallGraph.renderer.showArrows ? 'url(#arrowhead)' : null)
                .style('opacity', 1);
            
            // 恢復點擊區域透明度
            container.selectAll('.link-clickarea')
                .style('opacity', 1);
            
            // 恢復節點狀態
            container.selectAll('.node')
                .style('opacity', 1)
                .attr('stroke-width', 2);
        }
    }
    
    // 顯示節點詳細資訊
    showNodeDetails(node) {
        const panel = document.getElementById('detailsPanel');
        const title = document.getElementById('detailsTitle');
        const content = document.getElementById('detailsContent');
        
        if (!panel || !title || !content) return;
        
        title.textContent = `節點資訊 - ${node.ip}`;
        
        // 獲取相關連線
        const relatedLinks = window.firewallGraph.links.filter(link => 
            link.source.id === node.id || link.target.id === node.id
        );
        
        content.innerHTML = `
            <div class="detail-section">
                <h4>基本資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">IP地址:</span>
                        <span class="detail-value">${node.ip || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">主機名稱:</span>
                        <span class="detail-value">${node.hostname || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">所屬區域:</span>
                        <span class="detail-value">${node.zone || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">地區:</span>
                        <span class="detail-value">${node.region || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">對象名稱:</span>
                        <span class="detail-value">${node.object || '未設定'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>連線統計</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">總連線數:</span>
                        <span class="detail-value">${relatedLinks.length}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">出站連線:</span>
                        <span class="detail-value">${relatedLinks.filter(l => l.source.id === node.id).length}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">入站連線:</span>
                        <span class="detail-value">${relatedLinks.filter(l => l.target.id === node.id).length}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>相關服務</h4>
                <div class="detail-grid">
                    ${[...new Set(relatedLinks.map(l => l.service))].map(service => {
                        const serviceLinks = relatedLinks.filter(l => l.service === service);
                        const description = `${serviceLinks.length} 個連線`;
                        return `<div class="detail-item">
                            <span class="detail-label">${service}:</span>
                            <span class="detail-value">${description}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        panel.classList.add('open');
    }
    
    // 顯示連線詳細資訊
    showLinkDetails(link) {
        const panel = document.getElementById('detailsPanel');
        const title = document.getElementById('detailsTitle');
        const content = document.getElementById('detailsContent');
        
        if (!panel || !title || !content) {
            return;
        }
        
        // 儲存當前選中的連線和相關連線組
        this.currentLinkGroup = this.getLinkGroup(link);
        
        // 預設從第一個連線開始，除非是通過切換進來的
        if (this.currentSelectedLinkIndex === undefined || this.currentSelectedLinkIndex === null) {
            this.currentSelectedLinkIndex = 0;
        }
        
        // 使用索引對應的連線來渲染詳細資訊
        const linkToShow = this.currentLinkGroup[this.currentSelectedLinkIndex];
        
        let connectionType = '';
        if (linkToShow.isMultiple) {
            if (linkToShow.hasMultiplePorts) {
                connectionType = ` (多埠號連線 ${this.currentSelectedLinkIndex + 1}/${this.currentLinkGroup.length})`;
            } else {
                connectionType = ` (重複連線 ${this.currentSelectedLinkIndex + 1}/${this.currentLinkGroup.length})`;
            }
        }
        title.textContent = `連線資訊${connectionType}`;
        
        this.renderLinkDetails(linkToShow);
        
        panel.classList.add('open');
    }
    
    // 獲取與指定連線屬於同一組的所有連線
    getLinkGroup(targetLink) {
        const sourceId = typeof targetLink.source === 'object' ? targetLink.source.id : targetLink.source;
        const targetId = typeof targetLink.target === 'object' ? targetLink.target.id : targetLink.target;
        
        return window.firewallGraph.links.filter(link => {
            const linkSourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const linkTargetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (linkSourceId === sourceId && linkTargetId === targetId) ||
                   (linkSourceId === targetId && linkTargetId === sourceId);
        });
    }
    
    // 渲染連線詳細資訊
    renderLinkDetails(link) {
        const content = document.getElementById('detailsContent');
        if (!content) return;
        
        const record = link.record;
        
        // 如果有多個連線，創建埠號導航器
        let portNavigatorHtml = '';
        if (link.isMultiple && this.currentLinkGroup.length > 1) {
            const currentIndex = this.currentSelectedLinkIndex;
            const totalCount = this.currentLinkGroup.length;
            const currentPort = link.record?.targetPort || '未知';
            const currentService = link.record?.service || '未知';
            
            portNavigatorHtml = `
                <div class="detail-section">
                    <h4>連線導航</h4>
                    <div class="port-navigator">
                        <button class="nav-btn prev-btn" 
                                onclick="window.firewallGraph.interactionHandler.switchToPrevLink()"
                                ${currentIndex === 0 ? 'disabled' : ''}>
                            ◀
                        </button>
                        <div class="port-info">
                            <div class="port-details">
                                <span class="port-number">埠號: ${currentPort}</span>
                                <span class="service-name">服務: ${currentService}</span>
                            </div>
                            <div class="port-counter">${currentIndex + 1} / ${totalCount}</div>
                        </div>
                        <button class="nav-btn next-btn" 
                                onclick="window.firewallGraph.interactionHandler.switchToNextLink()"
                                ${currentIndex === totalCount - 1 ? 'disabled' : ''}>
                            ▶
                        </button>
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            ${portNavigatorHtml}
            <div class="detail-section">
                <h4>連線基本資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">來源IP:</span>
                        <span class="detail-value">${record.sourceIP || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標IP:</span>
                        <span class="detail-value">${record.targetIP || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">服務類型:</span>
                        <span class="detail-value">${link.hasMultiplePorts && link.allServices.length > 1 ? link.allServices.join(',') : (record.service || '未知')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標埠號:</span>
                        <span class="detail-value">${link.hasMultiplePorts ? link.allPorts.join(',') : (record.targetPort || '未設定')}</span>
                    </div>
                    ${link.isMultiple ? `
                    <div class="detail-item">
                        <span class="detail-label">連線類型:</span>
                        <span class="detail-value">${link.hasMultiplePorts ? '多埠號連線' : '重複連線'} (${link.multipleIndex + 1} / ${link.multipleTotal})</span>
                    </div>
                    ${link.hasMultiplePorts ? `
                    <div class="detail-item">
                        <span class="detail-label">當前埠號:</span>
                        <span class="detail-value">${link.currentPort}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">當前服務:</span>
                        <span class="detail-value">${link.currentService}</span>
                    </div>
                    ` : ''}
                    ` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>來源資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">來源區域:</span>
                        <span class="detail-value">${record.sourceZone || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">來源地區:</span>
                        <span class="detail-value">${record.sourceRegion || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">來源主機:</span>
                        <span class="detail-value">${record.sourceHostname || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">來源對象:</span>
                        <span class="detail-value">${record.sourceObject || '未設定'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>目標資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">目標區域:</span>
                        <span class="detail-value">${record.targetZone || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標地區:</span>
                        <span class="detail-value">${record.targetRegion || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標主機:</span>
                        <span class="detail-value">${record.targetHostname || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標網域:</span>
                        <span class="detail-value">${record.targetDomain || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">目標對象:</span>
                        <span class="detail-value">${record.targetObject || '未設定'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>申請資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">應用場景:</span>
                        <span class="detail-value">${record.applicationScenario || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">申請單位:</span>
                        <span class="detail-value">${record.requestUnit || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">負責人:</span>
                        <span class="detail-value">${record.responsible || '未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">申請單號:</span>
                        <span class="detail-value">${record.requestNumber || '未設定'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 隱藏詳細資訊面板
    hideDetails() {
        const panel = document.getElementById('detailsPanel');
        if (panel) {
            panel.classList.remove('open');
        }
        this.clearSelection();
    }
    
    // 清除選擇
    clearSelection() {
        this.selectedNode = null;
        this.selectedLink = null;
        this.currentLinkGroup = null;
        this.currentSelectedLinkIndex = null;
        
        const container = window.firewallGraph.renderer.container;
        
        // 清除高亮，恢復所有元素的正常狀態
        container.selectAll('.node')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('opacity', 1);
        
        container.selectAll('.link')
            .attr('stroke', d => Utils.getLinkColor(d.service))
            .attr('stroke-width', 2)
            .attr('marker-end', window.firewallGraph.renderer.showArrows ? 'url(#arrowhead)' : null)
            .style('opacity', 1);
        
        // 恢復標籤的正常狀態
        container.selectAll('.node-label')
            .style('opacity', 1)
            .style('font-weight', '500');
    }
    
    // 高亮節點
    highlightNode(node) {
        const container = window.firewallGraph.renderer.container;
        const config = window.firewallGraph.config;
        
        container.selectAll('.node')
            .attr('stroke', d => d.id === node.id ? config.colors.selected : '#fff')
            .attr('stroke-width', d => d.id === node.id ? 3 : 2);
    }
    
    // 高亮連線
    highlightLink(link) {
        const container = window.firewallGraph.renderer.container;
        const config = window.firewallGraph.config;
        
        container.selectAll('.link')
            .attr('stroke', d => d.id === link.id ? config.colors.linkHighlight : Utils.getLinkColor(d.service))
            .attr('stroke-width', d => d.id === link.id ? 4 : 2)
            .attr('marker-end', d => {
                if (!window.firewallGraph.renderer.showArrows) return null; // 如果箭頭被隱藏，則不顯示
                return d.id === link.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
            });
    }
    
    // 高亮相連節點
    highlightConnectedNodes(selectedNode) {
        const container = window.firewallGraph.renderer.container;
        const links = window.firewallGraph.links;
        const config = window.firewallGraph.config;
        
        // 找出與選中節點相連的所有節點ID和連線ID
        const connectedNodeIds = new Set();
        const relatedConnections = new Set();
        connectedNodeIds.add(selectedNode.id);
        
        links.forEach(link => {
            if (link.source.id === selectedNode.id) {
                connectedNodeIds.add(link.target.id);
                relatedConnections.add(link.id);
                // 查找反向連線
                const reverseLink = links.find(l => 
                    l.source.id === link.target.id && l.target.id === link.source.id && l.id !== link.id
                );
                if (reverseLink) {
                    relatedConnections.add(reverseLink.id);
                }
            }
            if (link.target.id === selectedNode.id) {
                connectedNodeIds.add(link.source.id);
                relatedConnections.add(link.id);
                // 查找反向連線
                const reverseLink = links.find(l => 
                    l.source.id === link.target.id && l.target.id === link.source.id && l.id !== link.id
                );
                if (reverseLink) {
                    relatedConnections.add(reverseLink.id);
                }
            }
        });
        
        // 高亮相關節點，讓其他節點變暗
        container.selectAll('.node')
            .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.2)
            .attr('stroke', d => {
                if (d.id === selectedNode.id) return config.colors.selected;
                if (connectedNodeIds.has(d.id)) return config.colors.hover;
                return '#fff';
            })
            .attr('stroke-width', d => {
                if (d.id === selectedNode.id) return 3;
                if (connectedNodeIds.has(d.id)) return 2.5;
                return 2;
            });
        
        // 高亮相關連線（包括雙向連線），讓其他連線變暗
        container.selectAll('.link')
            .style('opacity', d => 
                relatedConnections.has(d.id) ? 1 : 0.1
            )
            .attr('stroke-width', d =>
                relatedConnections.has(d.id) ? 3 : 1
            )
            .attr('stroke', d => 
                relatedConnections.has(d.id) ? config.colors.linkHighlight : config.colors.link
            )
            .attr('marker-end', d => {
                if (!window.firewallGraph.renderer.showArrows) return null;
                return relatedConnections.has(d.id) ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
            });
        
        // 讓標籤也相應地變化
        container.selectAll('.node-label')
            .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.3)
            .style('font-weight', d => d.id === selectedNode.id ? 'bold' : 'normal');
    }
    
    // 高亮連線的兩個端點
    highlightLinkNodes(selectedLink) {
        const container = window.firewallGraph.renderer.container;
        const links = window.firewallGraph.links;
        const config = window.firewallGraph.config;
        
        const sourceId = selectedLink.source.id;
        const targetId = selectedLink.target.id;
        
        // 找出雙向連線對
        const relatedConnections = new Set([selectedLink.id]);
        const reverseLink = links.find(l => 
            l.source.id === selectedLink.target.id && l.target.id === selectedLink.source.id && l.id !== selectedLink.id
        );
        if (reverseLink) {
            relatedConnections.add(reverseLink.id);
        }
        
        // 讓所有節點變暗，只突出線段的兩個端點
        container.selectAll('.node')
            .style('opacity', d => (d.id === sourceId || d.id === targetId) ? 1 : 0.2)
            .attr('stroke', d => {
                if (d.id === sourceId || d.id === targetId) return config.colors.hover;
                return '#fff';
            })
            .attr('stroke-width', d => {
                if (d.id === sourceId || d.id === targetId) return 3;
                return 2;
            });
        
        // 讓所有連線變暗，只突出選中的連線（包括雙向連線）
        container.selectAll('.link')
            .style('opacity', d => relatedConnections.has(d.id) ? 1 : 0.1)
            .attr('stroke-width', d => relatedConnections.has(d.id) ? 4 : 1)
            .attr('stroke', d => relatedConnections.has(d.id) ? config.colors.linkHighlight : config.colors.link)
            .attr('marker-end', d => {
                if (!window.firewallGraph.renderer.showArrows) return null;
                return relatedConnections.has(d.id) ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
            });
        
        // 讓標籤也相應地變化
        container.selectAll('.node-label')
            .style('opacity', d => (d.id === sourceId || d.id === targetId) ? 1 : 0.3)
            .style('font-weight', d => (d.id === sourceId || d.id === targetId) ? 'bold' : 'normal');
    }
    
    // 切換到指定索引的連線
    switchToLink(linkIndex) {
        if (!this.currentLinkGroup || linkIndex < 0 || linkIndex >= this.currentLinkGroup.length) {
            return;
        }
        
        const newLink = this.currentLinkGroup[linkIndex];
        this.currentSelectedLinkIndex = linkIndex;
        
        // 更新高亮，但不清除 currentLinkGroup 和 currentSelectedLinkIndex
        this.selectedNode = null;
        this.selectedLink = newLink;
        
        const container = window.firewallGraph.renderer.container;
        
        // 清除高亮，恢復所有元素的正常狀態
        container.selectAll('.node')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('opacity', 1);
        
        container.selectAll('.link')
            .attr('stroke', d => Utils.getLinkColor(d.service))
            .attr('stroke-width', 2)
            .attr('marker-end', window.firewallGraph.renderer.showArrows ? 'url(#arrowhead)' : null)
            .style('opacity', 1);
        
        // 恢復標籤的正常狀態
        container.selectAll('.node-label')
            .style('opacity', 1)
            .style('font-weight', '500');
            
        // 重新高亮新的連線
        this.highlightLink(newLink);
        this.highlightLinkNodes(newLink);
        
        // 更新詳細資訊
        const title = document.getElementById('detailsTitle');
        if (title) {
            let connectionType = '';
            if (newLink.isMultiple) {
                if (newLink.hasMultiplePorts) {
                    connectionType = ` (多埠號連線 ${linkIndex + 1}/${this.currentLinkGroup.length})`;
                } else {
                    connectionType = ` (重複連線 ${linkIndex + 1}/${this.currentLinkGroup.length})`;
                }
            }
            title.textContent = `連線資訊${connectionType}`;
        }
        
        this.renderLinkDetails(newLink);
    }
    
    // 切換到上一個連線
    switchToPrevLink() {
        if (!this.currentLinkGroup || this.currentSelectedLinkIndex <= 0) {
            return;
        }
        this.switchToLink(this.currentSelectedLinkIndex - 1);
    }
    
    // 切換到下一個連線
    switchToNextLink() {
        if (!this.currentLinkGroup || this.currentSelectedLinkIndex >= this.currentLinkGroup.length - 1) {
            return;
        }
        this.switchToLink(this.currentSelectedLinkIndex + 1);
    }
}

window.InteractionHandler = InteractionHandler; 