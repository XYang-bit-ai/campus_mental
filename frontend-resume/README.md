# 校园心理健康智能评估与干预平台 · 前端

> 基于 Vue 3 的校园心理健康评估系统前端，包含学生端（心理测评、AI 心灵树洞、资源库、预约）与管理端（数据统计、可视化大屏、测评管理）。

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 + `<script setup>` | 组合式 API，全组件统一 |
| 构建 | Vite 6 | 开发热更新 + 生产 manualChunks 分包 |
| 状态管理 | Pinia 3 | 学生/管理员双登录态 + 工厂模式去重 |
| 路由 | Vue Router 4 | 全路由懒加载 + 角色守卫 |
| UI | Element Plus + Tailwind CSS v4 | 组件库 + 原子化样式，CSS 变量统一主题 |
| 可视化 | ECharts 5（按需引入） | 饼图/柱状图，仅注册用到的图表类型 |
| HTTP | Axios + Fetch SSE | 常规请求 + 流式 AI 对话 |
| 工具 | dayjs | 时间格式化 |

## 项目结构

```
frontend-resume/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js                     # 入口：Pinia → 主题同步 → Router → Element Plus
    ├── App.vue                     # 根组件：顶栏 + 页面过渡动画
    ├── api/
    │   └── index.js                # Axios 实例 + 请求/响应拦截器（401/403/5xx）
    ├── composables/
    │   ├── createAuthStore.js      # Auth store 工厂 — 消除 student/admin 重复
    │   ├── useECharts.js           # ECharts composable — init/resize/dispose/主题
    │   └── useSSE.js               # SSE 流式通信 — Fetch + ReadableStream + Abort
    ├── stores/
    │   ├── studentAuth.js          # 学生登录态（5 行，工厂生成）
    │   ├── adminAuth.js            # 管理员登录态（5 行，工厂生成）
    │   └── theme.js                # 深浅色主题 + localStorage 持久化
    ├── router/
    │   └── index.js                # 全部 () => import() 懒加载 + beforeEach 守卫
    ├── components/
    │   ├── AppHeader.vue           # 响应式导航栏（桌面端 + 移动端 hamburger）
    │   ├── ThemeToggle.vue         # 深浅色切换按钮
    │   ├── NoticeBanner.vue        # 通知横幅（info/error 变体）
    │   └── SkeletonCard.vue        # 骨架屏加载占位
    ├── views/
    │   ├── LoginView.vue           # 学生登录 + 忘记密码
    │   ├── RegisterView.vue        # 学生注册
    │   ├── EvaluationView.vue      # 心理测评（进度条 + 骨架屏）
    │   ├── ResultView.vue          # 测评结果展示
    │   ├── ResourceListView.vue    # 心理资源库（筛选 + 分页 + 空状态）
    │   ├── ResourceDetailView.vue  # 资源详情
    │   ├── AppointmentView.vue     # 咨询预约
    │   ├── PersonalCenterView.vue  # 学生个人中心（测评 + 预约记录）
    │   ├── AiChatView.vue          # 心灵树洞（SSE 流式 + 时间戳 + 打字动画）
    │   ├── AdminLoginView.vue      # 管理员登录 + 受控注册
    │   ├── AdminStatisticView.vue  # 数据统计（useECharts composable）
    │   ├── AdminDashboardView.vue  # 数据可视化大屏（暗色主题 + KPI）
    │   ├── AdminEvaluationView.vue # 测评记录管理
    │   └── AdminPersonalCenterView.vue  # 管理员中心 + 改密
    ├── utils/
    │   └── redirect.js             # 安全重定向（防开放重定向）
    └── assets/
        └── main.css                # CSS 变量主题系统 + Tailwind 配置
```

## 核心设计

### 1. Auth Store 工厂模式

`createAuthStore.js` 将学生/管理员两套几乎相同的登录态逻辑抽象为工厂函数：

```js
// stores/studentAuth.js — 仅 5 行
export const useStudentAuthStore = createAuthStore('studentAuth', {
  accessToken: 'access_token',
  userId: 'user_id',
  username: 'username',
  role: 'role',
})
```

工厂内部统一处理 `ref` 创建、`localStorage` 读写、`setSession` / `clearSession`，新增角色只需声明字段映射。

### 2. useECharts Composable

统一封装 ECharts 生命周期，避免每个图表页重复写 `init → resize → dispose`：

```js
const { chart, refresh } = useECharts(chartRef, getOption, { watchSource: dataRef })
```

- 自动 `onMounted` 初始化 + `window.resize` 监听
- 自动 `onUnmounted` 清理，防止内存泄漏
- `watchSource` 变化时自动 `setOption` 刷新

### 3. useSSE 流式通信

封装 Fetch + ReadableStream 的 SSE 解析，支持 `AbortController` 取消：

```js
const sse = useSSE()
await sse.start({
  url: '/api/v1/ai/chat/stream',
  token: studentAuth.accessToken,
  payload: { messages: history },
  onChunk(text) { /* 逐字追加 */ },
  onError(msg) { /* 错误处理 */ },
  onDone() { /* 完成回调 */ },
})
```

### 4. CSS 变量主题系统

用 CSS 变量统一驱动 Tailwind 和 Element Plus 的深浅色，替代全局 `!important` 覆盖：

```css
:root { --app-text-primary: #1e293b; --app-bg-card: #ffffff; }
.dark  { --app-text-primary: #f1f5f9; --app-bg-card: #1e293b; }

/* 同步 Element Plus 变量 */
.dark { --el-text-color-primary: #f1f5f9; --el-bg-color: #1e293b; }
```

### 5. 路由懒加载 + 分包策略

```js
// router — 全部懒加载
{ path: '/evaluation', component: () => import('@/views/EvaluationView.vue') }

// vite.config.js — 手动分包
manualChunks: {
  'vendor-vue': ['vue', 'vue-router', 'pinia'],
  'vendor-echarts': ['echarts'],
  'vendor-element': ['element-plus'],
}
```

## 功能清单

### 学生端

| 功能 | 说明 |
|------|------|
| 注册 / 登录 | 表单验证 + 记住密码 + 回车提交 |
| 心理测评 | PHQ-9 / SCL-90 量表、**实时进度条**、骨架屏加载 |
| 测评结果 | 总分 + 情绪标签 + AI/模板建议 |
| 心理资源库 | 类型筛选 + 分页 + **空状态提示** + 骨架屏 |
| 咨询预约 | 日期 + 时段选择 |
| 个人中心 | 用户信息 + 测评/预约记录 + 详情弹窗 |
| 心灵树洞 | **SSE 流式** AI 对话、消息时间戳、**打字动画**、AbortController 取消 |

### 管理端

| 功能 | 说明 |
|------|------|
| 管理员登录 | 受控注册（密钥校验） |
| 数据统计 | 情绪/量表 ECharts 图表 + 日期筛选 + CSV 导出 |
| 数据大屏 | 暗色科技风 + KPI 卡片 + 实时时钟 + 响应式布局 |
| 测评记录 | 分页列表 + AI 来源标签 |
| 管理员中心 | 信息展示 + 修改密码 |

## 与原版对比

| 维度 | 原版 | 简历版 |
|------|------|--------|
| 路由加载 | 14 个页面全部静态 import | 全部 `() => import()` 懒加载 |
| ECharts | `import *` 全量 ~800KB | `echarts/core` 按需引入，减少 ~70% |
| Store | studentAuth/adminAuth 两份重复代码 | `createAuthStore` 工厂，各 5 行 |
| 图表生命周期 | 每个页面独立 init/resize/dispose | `useECharts` composable 统一管理 |
| SSE 通信 | 内联 60 行 fetch+parser | `useSSE` composable，支持 abort |
| 响应式导航 | 小屏溢出 | hamburger 菜单 + transition |
| 加载状态 | 无 | SkeletonCard 骨架屏 + shimmer 动画 |
| 测评进度 | 无 | 已答 N/M + progress bar |
| 对话时间 | 无 | 每条消息 HH:mm |
| 打字指示 | 纯文字 | 三点弹跳动画 |
| 页面过渡 | 无 | fade transition |
| 错误处理 | catch 全吞"服务器错误" | 优先展示后端 msg，403 单独处理 |
| CSS 架构 | 大量 `!important` | CSS 变量覆盖，零 `!important` |
| 构建优化 | 无 | manualChunks 分离三方库 |
| 表单验证 | 回调式 | async/await |

## 快速开始

```bash
cd frontend-resume
npm install
npm run dev
```

默认访问 http://localhost:5173，接口代理到 http://127.0.0.1:8002。

## 构建部署

```bash
npm run build
```

产物在 `dist/` 目录，可由 Nginx 托管并反向代理 `/api` 到后端。
