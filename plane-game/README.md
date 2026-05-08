# 星际生存战

网页竖屏射击小游戏：自动射击、躲避敌机与弹幕，挑战更高分与生存时间。手机与桌面浏览器均可游玩。

## 玩法简述（Roguelite 生存）

- **移动**：拖动 / WASD；**自动向正上方射击**。
- **经验**：击败敌人掉落经验球（可被磁力吸引）；经验满后升级；**每升 4 级**（Lv 4、8、12…）触发一次**三选一技能**（可重复叠加强化）。
- **敌人**：从屏幕边缘涌来的追击者、虫群、重甲与保持距离开火的炮台；**Boss** 会按血量切换弹幕阶段。
- **道具**：仍可能掉落回血球 / 清屏球（清屏对 Boss 为削血而非秒杀）。
- **最高分**：保存在本机浏览器（`localStorage`）。

## 操作

| 平台 | 操作 |
|------|------|
| 电脑 | `WASD` 或方向键移动；`空格` 开始 / 重开 |
| 手机 | 单指拖动（飞船略在手指上方，避免遮挡） |

## 本地运行

本项目使用 ES Module，需通过 **HTTP** 打开。**不要**从资源管理器双击 `index.html`（地址栏若是 `file:///...` 往往会白屏或脚本报错）。

### 方式 A：双击批处理（Windows）

双击本目录下的 `start-server.bat`，看到终端里服务已启动后，在浏览器地址栏输入：

`http://localhost:8765/`

### 方式 B：命令行

在 **`plane-game` 文件夹所在目录** 打开终端（必须先 `cd` 进该文件夹，否则根路径不对会 404）：

```powershell
Set-Location d:\cur\plane-game
py -m http.server 8765
```

若 `py` 不可用，再试：

```powershell
python -m http.server 8765
```

浏览器访问：`http://localhost:8765/`（端口与命令里一致即可）。

### 浏览器「打不开」时自查

1. **地址**：必须是 `http://localhost:端口/` 或 `http://127.0.0.1:端口/`，不能是 `file:///...`。
2. **服务是否已启动**：终端里应先执行完上面的命令，再打开浏览器；关掉终端后页面会失效。
3. **端口被占用**：把命令里的 `8765` 改成 `8080`、`9000` 等，浏览器地址里的端口一起改。
4. **白屏**：按 `F12` 打开开发者工具 → **Console**，若有红色报错，把报错内容复制下来排查（常见是没用 HTTP 打开导致模块被拦截）。

## 分享给朋友（部署）

将整个 `plane-game` 文件夹上传到静态托管即可，根目录需包含 `index.html`。

- **Netlify**：登录 [Netlify](https://www.netlify.com/) → Add new site → Deploy manually → 拖拽文件夹，获得 `https://xxx.netlify.app` 链接。
- **GitHub Pages**：新建仓库，上传文件，在仓库 Settings → Pages 中启用，使用生成的 `https://用户名.github.io/仓库名/` 地址（若放在子路径，需保证 `index.html` 与 `css/`、`js/` 相对路径不变）。

同一 Wi-Fi 下也可用手机访问电脑局域网 IP + 端口（需在防火墙中放行对应端口）。

## 目录结构

```text
plane-game/
├── index.html
├── README.md
├── start-server.bat
├── css/
│   └── style.css
└── js/
    ├── main.js
    ├── game.js
    ├── entities.js
    ├── background.js
    ├── particles.js
    ├── powerups.js
    ├── progression.js
    ├── skills.js
    └── xpOrbs.js
```
