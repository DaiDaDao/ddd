# METRIC 项目约定

- 项目是纯前端 React + TypeScript + Vite 应用，不添加后端、数据库或 API 服务。
- 初始展示数据和界面文案统一放在 `public/metric` 下，通过 `fetch('/metric/...')` 读取。
- Todo、计薪状态、清单勾选和健康复查记录使用 React state 管理，并同步到浏览器 IndexedDB；计薪秒数仅在当前页面运行时计算，不写入 IndexedDB；不添加后端数据库。
- 保持五个主视图：总览、打工赚钱、六维成长、任务清单、健康复查。
- 新增按钮优先使用 `lucide-react` 图标；保留现有米白纸张、深青侧栏和珊瑚行动色的视觉语言。
- 修改后至少运行 `npm run lint` 和 `npm run build`。
- 响应式布局需要同时检查桌面端和约 390px 宽的手机视口。