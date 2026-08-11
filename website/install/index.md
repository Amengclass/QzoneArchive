---
title: 安装
---

# 安装

从 [GitHub Releases](https://github.com/Gaoshu705/QzoneArchive/releases) 下载与设备对应的最新版本。

## Windows

下载 `.exe` 安装程序并完成安装。系统需要 Windows 10 或更新版本，通常已包含 WebView2。

## macOS

根据设备下载 Intel 或 Apple Silicon 对应的 `.dmg`。首次启动时，系统可能要求在“隐私与安全性”中确认打开来源未知的应用。

## Android

下载 `.apk`，允许浏览器或文件管理器安装应用后按提示完成安装。请仅从项目 Releases 页面获取安装包。

## Linux

每个 Release 会提供三种 Linux 安装包：

- `.deb`：适合 Debian、Ubuntu 及其衍生发行版
- `.rpm`：适合 Fedora、openSUSE、RHEL 系发行版
- `.AppImage`：适合大多数桌面发行版，包括无法直接使用 `.deb`/`.rpm` 的发行版

### Debian / Ubuntu

```bash
sudo apt install ./QzoneArchive-*.deb
```

也可以使用 `dpkg`：

```bash
sudo dpkg -i QzoneArchive-*.deb
```

如果 `dpkg` 提示缺少依赖，先执行：

```bash
sudo apt-get install -f
```

### Fedora / openSUSE / RHEL 系

```bash
sudo rpm -i QzoneArchive-*.rpm
```

### 通用 AppImage

```bash
chmod +x QzoneArchive-*.AppImage
./QzoneArchive-*.AppImage
```

如果桌面环境没有自动集成应用菜单，可以自行创建 `.desktop` 文件，也可以直接把 AppImage 放到本地路径手动启动。

### NixOS

从 GitHub Releases 下载 `qzonearchive-nixos-x86_64-linux.tar.gz` 后，可以解压直接运行：

```bash
tar -xzf qzonearchive-nixos-x86_64-linux.tar.gz
./qzonearchive/bin/qzonearchive
```

也可以把解压出的目录加入 Nix profile：

```bash
tar -xzf qzonearchive-nixos-x86_64-linux.tar.gz
nix profile install ./qzonearchive
```

项目提供源码构建用的 Nix Flake。NixOS 用户可以进入项目目录执行：

```bash
nix build
./result/bin/qzonearchive
```

也可以安装到当前用户 profile：

```bash
nix profile install
```

如果只为了快速验证官方 Release 的 AppImage，可以先启用 AppImage 支持：

```nix
programs.appimage.enable = true;
```

然后执行：

```bash
chmod +x QzoneArchive-*.AppImage
./QzoneArchive-*.AppImage
```

Linux 用户安装 QQ 客户端时，请按你自己发行版的要求选择 QQ 官方提供的 deb、rpm 或 Flatpak 版本；空间归档本身不绑定或内置 QQ 客户端，只需要登录后扫描 QQ 空间的二维码即可使用。

从源码构建 Linux 版本可参考[开发](../development/)。
