# This is free software, licensed under the Apache License, Version 2.0 .

include $(TOPDIR)/rules.mk

PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=LuCI Airoha NPU Status
LUCI_DEPENDS:=+luci-base @TARGET_airoha

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
