const express = require('express');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 欄位定義 
const FIELD_MAPPING = {
  'ID': 'id',
  '來源區域': 'sourceZone',
  '來源地區': 'sourceRegion',
  '來源主機名稱': 'sourceHostname',
  '來源IP': 'sourceIP',
  '來源對象': 'sourceObject',
  '目標區域': 'targetZone',
  '目標地區': 'targetRegion',
  '目標主機名稱': 'targetHostname',
  '目標網域': 'targetDomain',
  '目標IP': 'targetIP',
  '目標埠號': 'targetPort',
  '目標應用程式': 'targetObject',   
  '服務': 'service',
  '應用場景': 'applicationScenario',
  '申請單位': 'requestUnit',
  '負責人': 'responsible',
  '申請單號': 'requestNumber'
};

// 解析文件
function parseExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length === 0) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map((row, index) => {
      const obj = { recordId: index + 1 };
      headers.forEach((header, headerIndex) => {
        const mappedField = FIELD_MAPPING[header] || header;
        obj[mappedField] = row[headerIndex] || '';
      });
      return obj;
    }).filter(record => record.sourceIP && record.targetIP);
  } catch (error) {
    console.error('解析 Excel 文件時出錯:', error);
    return [];
  }
}

// 處理網路圖數據
function processNetworkData(data) {
  const nodes = new Map();
  const links = [];
  const zones = new Set();
  const services = new Set();

  data.forEach((record, index) => {
    const sourceIP = record.sourceIP;
    const targetIP = record.targetIP;
    const sourceZone = record.sourceZone || '未知區域';
    const targetZone = record.targetZone || '未知區域';
    const service = record.service || '未知服務';

    // 收集所有區域和服務
    zones.add(sourceZone);
    zones.add(targetZone);
    services.add(service);

    // 檢查IP是否有效
    const isValidIP = (ip) => {
      if (!ip || typeof ip !== 'string') return false;
      return /^[\d\.\/\-,\s]+$/.test(ip.trim());
    };

    // 創建或更新來源節點
    if (isValidIP(sourceIP)) {
      if (!nodes.has(sourceIP)) {
        nodes.set(sourceIP, {
          id: sourceIP,
          type: 'source',
          ip: sourceIP,
          zone: sourceZone,
          region: record.sourceRegion || '',
          hostname: record.sourceHostname || '',
          object: record.sourceObject || '',
          connections: [],
          allZones: new Set([sourceZone])
        });
      } else {
        // 更新現有節點
        const existingNode = nodes.get(sourceIP);

        if (!existingNode.allZones) {
          existingNode.allZones = new Set([existingNode.zone]);
        }
        existingNode.allZones.add(sourceZone);
        
        if (sourceZone !== '未知區域') {
          existingNode.zone = sourceZone; 
        }
        
        existingNode.region = record.sourceRegion || existingNode.region;
        existingNode.hostname = record.sourceHostname || existingNode.hostname;
        existingNode.object = record.sourceObject || existingNode.object;
      }
    }

    // 創建或更新目標節點
    if (isValidIP(targetIP)) {
      if (!nodes.has(targetIP)) {
        nodes.set(targetIP, {
          id: targetIP,
          type: 'target',
          ip: targetIP,
          zone: targetZone,
          region: record.targetRegion || '',
          hostname: record.targetHostname || '',
          domain: record.targetDomain || '',
          object: record.targetObject || '',
          connections: [],
          allZones: new Set([targetZone])
        });
      } else {
        // 更新現有節點
        const existingNode = nodes.get(targetIP);
        
        if (!existingNode.allZones) {
          existingNode.allZones = new Set([existingNode.zone]);
        }
        existingNode.allZones.add(targetZone);
        
        if (targetZone !== '未知區域' && existingNode.zone === '未知區域') {
          existingNode.zone = targetZone; 
        }
        
        existingNode.region = record.targetRegion || existingNode.region;
        existingNode.hostname = record.targetHostname || existingNode.hostname;
        existingNode.domain = record.targetDomain || existingNode.domain;
        existingNode.object = record.targetObject || existingNode.object;
      }
    }

    // 創建連線
    if (isValidIP(sourceIP) && isValidIP(targetIP)) {
      const linkId = `${sourceIP}-${targetIP}-${index}`;
      const link = {
        id: linkId,
        source: sourceIP,
        target: targetIP,
        service: service,
        ports: record.targetPort ? record.targetPort.toString().split(',').map(p => p.trim()) : [],
        record: record
      };
      
      links.push(link);

      // 更新節點連線資訊
      if (nodes.has(sourceIP)) {
        nodes.get(sourceIP).connections.push(targetIP);
      }
      if (nodes.has(targetIP)) {
        nodes.get(targetIP).connections.push(sourceIP);
      }
    }
  });

  const cleanedNodes = Array.from(nodes.values()).map(node => {
    const { allZones, ...cleanedNode } = node;
    return cleanedNode;
  });

  return {
    nodes: cleanedNodes,
    links: links,
    zones: Array.from(zones),
    services: Array.from(services),
    stats: {
      totalNodes: nodes.size,
      totalLinks: links.length,
      totalZones: zones.size,
      totalServices: services.size
    }
  };
}

// API 路由

// 獲取原始防火牆數據
app.get('/api/firewall-data', (req, res) => {
  const filePath = 'firewall.xlsx';
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '找不到防火牆數據文件' });
  }
  
  const data = parseExcelFile(filePath);
  res.json(data);
});

// 獲取網路圖數據
app.get('/api/network-graph', (req, res) => {
  const filePath = 'firewall.xlsx';
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '找不到防火牆數據文件' });
  }
  
  const rawData = parseExcelFile(filePath);
  const processedData = processNetworkData(rawData);
  res.json(processedData);
});

// 獲取篩選後的網路圖數據
app.post('/api/network-graph/filtered', (req, res) => {
  const filePath = 'firewall.xlsx';
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '找不到防火牆數據文件' });
  }
  
  const rawData = parseExcelFile(filePath);
  const filters = req.body.filters || {};
  
  // 應用篩選條件
  let filteredData = rawData;
  
  if (filters.sourceZone && filters.sourceZone.length > 0) {
    filteredData = filteredData.filter(record => 
      filters.sourceZone.includes(record.sourceZone)
    );
  }
  
  if (filters.targetZone && filters.targetZone.length > 0) {
    filteredData = filteredData.filter(record => 
      filters.targetZone.includes(record.targetZone)
    );
  }
  
  if (filters.service && filters.service.length > 0) {
    filteredData = filteredData.filter(record => 
      filters.service.includes(record.service)
    );
  }
  
  if (filters.sourceIP) {
    filteredData = filteredData.filter(record => 
      record.sourceIP && record.sourceIP.includes(filters.sourceIP)
    );
  }
  
  if (filters.targetIP) {
    filteredData = filteredData.filter(record => 
      record.targetIP && record.targetIP.includes(filters.targetIP)
    );
  }
  
  const processedData = processNetworkData(filteredData);
  res.json(processedData);
});

// 獲取所有可用的篩選選項
app.get('/api/filter-options', (req, res) => {
  const filePath = 'firewall.xlsx';
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '找不到防火牆數據文件' });
  }
  
  const data = parseExcelFile(filePath);
  const options = {
    sourceZones: [...new Set(data.map(r => r.sourceZone).filter(Boolean))],
    targetZones: [...new Set(data.map(r => r.targetZone).filter(Boolean))],
    services: [...new Set(data.map(r => r.service).filter(Boolean))],
    requestUnits: [...new Set(data.map(r => r.requestUnit).filter(Boolean))],
    applicationScenarios: [...new Set(data.map(r => r.applicationScenario).filter(Boolean))]
  };
  
  res.json(options);
});

// 獲取特定記錄的詳細資訊
app.get('/api/record/:id', (req, res) => {
  const filePath = 'firewall.xlsx';
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '找不到防火牆數據文件' });
  }
  
  const data = parseExcelFile(filePath);
  const recordId = parseInt(req.params.id);
  const record = data.find(r => r.id === recordId);
  
  if (!record) {
    return res.status(404).json({ error: '找不到指定的記錄' });
  }
  
  res.json(record);
});

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 測試頁面路由
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(port, () => {
  console.log(`Firewall Network Graph running on http://localhost:${port}`);
}); 