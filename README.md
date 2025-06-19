# Firewall Network Diagram

An interactive chart system for visualizing firewall network topology and connection relationships. Supports multiple layout modes, filtering functions, and detailed information viewing to help administrators intuitively understand network architecture and firewall rules.

## Features

### Network Topology Visualization
- **Interactive Charts**: Smooth zooming and dragging operations based on D3.js
- **Multiple Layout Modes**: Force-directed layout and partition layout
- **Node Type Recognition**: Visual distinction between source nodes, target nodes, and bidirectional nodes
- **Connection Relationship Display**: Support for multiple connections and detailed connection information

### Smart Filtering System
- **Multi-dimensional Filtering**: Filter by zone, service, and IP address
- **Real-time Search**: Support for quick IP address search
- **Filter Combinations**: Apply multiple filter conditions simultaneously
- **Clear Reset**: One-click clear all filter conditions

### Detailed Information Display
- **Node Details**: Click nodes to view detailed information
- **Connection Details**: View firewall rules and port information
- **Statistics Panel**: Statistics for number of nodes, connections, and zones
- **Legend**: Clear visual element descriptions

### User Experience
- **Dark Mode**: Support for light and dark theme switching
- **Responsive Design**: Adapts to different screen sizes
- **Export Function**: Support for exporting charts as images
- **Documentation**: Built-in feature description popup

## Quick Start

### System Requirements
- Node.js (version 16.0+)

### Installation Steps

1. **Clone Project**
   ```bash
   git clone https://gitlab.deltaww.com/corp/it/rd_tool/firewall_network_graph.git
   cd firewall_network_graph
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Prepare Data File**
   Place the firewall rules Excel file in the project root directory, named `firewall.xlsx`

4. **Start Service**
   ```bash
   npm start
   ```

5. **Access Application**
   Open browser and visit `http://localhost:3000`

## 📁 Project Structure

```
firewall_network_graph/
├── app.js                 # Backend service main file
├── firewall.xlsx          # Firewall rules data file
├── package.json           # Project configuration and dependencies
├── public/                # Frontend static files
│   ├── index.html         # Main page
│   ├── styles.css         # Style file
│   └── js/                # JavaScript modules
│       ├── main.js                    # Main entry file
│       ├── firewall-network-graph.js  # Main class module
│       ├── data-manager.js            # Data management
│       ├── layout-manager.js          # Layout management
│       ├── renderer.js                # Graphics rendering
│       ├── interaction-handler.js     # Interaction handling
│       ├── ui-controller.js           # UI control
│       ├── utils.js                   # Utility functions
│       └── README.md                  # Module documentation
└── README.md              # Project documentation
```

## 📊 Excel Data Format

The system supports Excel files with the following fields:

| Field Name | Description | Required |
|------------|-------------|----------|
| ID | Unique identifier | ✓ |
| Source Zone | Source network zone | ✓ |
| Source IP | Source IP address | ✓ |
| Target Zone | Target network zone | ✓ |
| Target IP | Target IP address | ✓ |
| Target Port | Target port number | - |
| Service | Service type | - |
| Source Region | Source geographical region | - |
| Source Hostname | Source hostname | - |
| Source Object | Source object name | - |
| Target Region | Target geographical region | - |
| Target Hostname | Target hostname | - |
| Target Domain | Target domain name | - |
| Target Application | Target application | - |
| Application Scenario | Application scenario description | - |
| Requesting Unit | Requesting unit | - |
| Responsible Person | Responsible person | - |
| Request Number | Request number | - |
