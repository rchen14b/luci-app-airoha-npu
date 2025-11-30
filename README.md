# luci-app-airoha-npu

LuCI application for monitoring Airoha AN7581 NPU (Network Processing Unit) status on OpenWrt.

## Features

- Display NPU firmware version (TLB version format)
- Show NPU load status (loaded/not loaded)
- Display WiFi NPU offload version (MT7996/MT7992)
- Show NPU reserved memory regions with addresses and sizes
- Real-time PPE (Packet Processing Engine) flow offload entries
- Display flow statistics (packets, bytes) for each entry

## Screenshot

The app adds a "NPU Status" page under Status menu in LuCI showing:
- NPU Information (version, status)
- NPU Memory Regions (npu-binary, npu-pkt, npu-txpkt, npu-txbufid)
- PPE Flow Offload Entries table with state, type, flows, and statistics

## Installation

### From OpenWrt Feeds

Add this package to your OpenWrt build:

```bash
# Copy to feeds/luci/applications/
cp -r luci-app-airoha-npu feeds/luci/applications/

# Update and install
./scripts/feeds update luci
./scripts/feeds install luci-app-airoha-npu

# Enable in menuconfig
make menuconfig
# Navigate to: LuCI -> Applications -> luci-app-airoha-npu

# Build
make package/feeds/luci/luci-app-airoha-npu/compile
```

### Manual Installation

Copy files directly to your router:

```bash
# Create directories
mkdir -p /usr/share/luci/menu.d
mkdir -p /usr/share/rpcd/acl.d
mkdir -p /usr/libexec/rpcd
mkdir -p /www/luci-static/resources/view/airoha_npu

# Copy files
cp root/usr/share/luci/menu.d/luci-app-airoha-npu.json /usr/share/luci/menu.d/
cp root/usr/share/rpcd/acl.d/luci-app-airoha-npu.json /usr/share/rpcd/acl.d/
cp root/usr/libexec/rpcd/luci.airoha_npu /usr/libexec/rpcd/
cp htdocs/luci-static/resources/view/airoha_npu/status.js /www/luci-static/resources/view/airoha_npu/

# Set permissions and restart rpcd
chmod +x /usr/libexec/rpcd/luci.airoha_npu
/etc/init.d/rpcd restart
```

## Requirements

- OpenWrt with LuCI
- Airoha AN7581 target (`@TARGET_airoha`)
- PPE debugfs enabled (`/sys/kernel/debug/ppe/entries`)

## Files

```
luci-app-airoha-npu/
├── Makefile                                          # OpenWrt package makefile
├── htdocs/
│   └── luci-static/resources/view/airoha_npu/
│       └── status.js                                 # LuCI JavaScript view
└── root/
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.airoha_npu                       # RPC backend script
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-airoha-npu.json          # Menu configuration
            └── rpcd/acl.d/
                └── luci-app-airoha-npu.json          # ACL permissions
```

## Data Sources

The app reads data from:
- `dmesg` - NPU version, memory regions, load status
- `/sys/kernel/debug/ppe/entries` - PPE flow offload table
- `/sys/kernel/debug/ppe/bind` - Bound PPE entries

## License

Apache-2.0

## Author

Created for W1700K router (Airoha AN7581 + MT7996 BE19000)
