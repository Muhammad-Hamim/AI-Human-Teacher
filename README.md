# AI Human Teacher - Interactive Chinese Learning Platform

## 作品信息 Project Information

- 作品编号 Project ID: (待分配 To be assigned)
- 作品名称 Project Name: AI Human Teacher - Interactive Chinese Learning Platform
- 作品大类 Main Category: 软件应用与开发 Software Application and Development
- 作品小类 Sub-category: 智能教育 Intelligent Education

## 作品简介 Project Overview

AI Human Teacher 是一个创新的中文学习平台，利用人工智能技术为学习者提供沉浸式的语言学习体验。平台融合了实时语音对话、诗词学习、文化探索等功能，通过人工智能助教实现个性化学习指导。系统支持中英双语切换，并提供实时语音评测与反馈，让学习更加自然和高效。

AI Human Teacher is an innovative Chinese learning platform that leverages artificial intelligence(**DeepSeek**) to provide an immersive language learning experience. The platform integrates real-time voice conversations, poetry learning, cultural exploration, and other features, delivering personalized learning guidance through an AI teaching assistant. The system supports bilingual switching between Chinese and English, providing real-time pronunciation assessment and feedback for more natural and efficient learning.

## 创新描述 Innovation Highlights

1. **实时 AI 语音交互 Real-time AI Voice Interaction**

   - WebRTC 实现的低延迟语音对话 Low-latency voice dialogue using WebRTC
   - Edge TTS 提供的自然语音合成 Natural voice synthesis powered by Edge TTS
   - 实时语音评测和反馈 Real-time pronunciation assessment and feedback

2. **智能诗词教学 Intelligent Poetry Teaching**

   - 深度分析诗词内容 Deep analysis of poetry content
   - 互动式朗读练习 Interactive reading practice
   - 文化背景知识讲解 Cultural background explanation

3. **个性化学习体验 Personalized Learning Experience**
   - 自适应学习路径 Adaptive learning paths
   - 多模态交互界面 Multi-modal interaction interface

## 技术架构 Technical Architecture

### 前端技术栈 Frontend Stack

- React 19.0.0 + TypeScript
- Redux Toolkit 状态管理
- Socket.io-client 实时通信
- TailwindCSS + Radix UI 界面设计
- Framer Motion 动画效果
- WebRTC API 音视频处理

### 后端技术栈 Backend Stack

- Node.js + Express
- TypeScript
- MongoDB 数据库
- Socket.io WebRTC 信令服务
- Edge TTS 语音合成
- DeepSeek AI 模型集成

## 系统要求 System Requirements

### 开发环境 Development Environment

- Node.js >= 16.0.0
- MongoDB >= 6.0
- NPM or Yarn
- Modern web browser with WebRTC support

### 运行平台 Runtime Platform

- 支持 WebRTC 的现代浏览器 Modern browsers with WebRTC support
  - Google Chrome (推荐 Recommended)
  - Microsoft Edge
  - Safari

## 部署说明 Deployment Instructions

### 克隆代码库 Clone the Repository

## Backend

```bash
git clone --branch server-side https://github.com/Muhammad-Hamim/AI-Human-Teacher.git backend
```


### 安装依赖 Install Dependencies

#### 后端 Backend

```bash
cd backend
npm install
```

### 安装 Edge TTS 依赖 Install Edge TTS Dependency

在 `backend` 目录下运行以下命令安装 Edge TTS 依赖：

```bash
install_edgetts.bat
```

### 配置环境变量 Configure Environment Variables

在 `backend` 目录下创建 `.env` 文件，并添加以下内容：

```env
NODE_ENV=development
PORT=5000
BCRYPT_SALT_ROUNDS=12
DATABASE_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai-human-teacher?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<your_access_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=360d
CLOUDINARY_COULD_NAME=<your_cloudinary_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
AI_API_KEY=<your_ai_api_key>
AI_BASE_URL=https://openrouter.ai/api/v1
CLIENT_URL=http://localhost:5173
```

### 启动服务 Start the Services

#### 启动后端服务 Start Backend

```bash
npm run start:dev
```

**After successfully setup backend now setup and run frontend**

## Frontend

### 克隆代码库 Clone the Repository

```bash
git clone https://github.com/Muhammad-Hamim/AI-Human-Teacher.git frontend
```


### 安装依赖 Install Dependencies

#### 前端 Frontend

```bash
cd frontend
npm install
```

#### 启动前端服务 Start Frontend

```bash
npm run dev
```

### 访问应用 Access the Application

打开浏览器并访问：

```
http://localhost:5173
```

## 特别说明 Special Notes

1. **地图来源**：本作品中如有涉及疆域的地图，均来源于公开授权的地图资源，并标注有效的地图审图号。
2. **前期基础**：本作品基于现有的 AI 技术和 WebRTC 技术开发，参赛的主要工作包括语音交互系统的实现、诗词学习平台的设计与开发。
3. **人工智能辅助工具**：本作品使用了以下人工智能辅助工具：
   - DeepSeek AI 模型：提供智能对话和诗词分析功能。
   - Edge TTS：实现高质量的语音合成功能。

## 作者及其分工比例 Authors and Contribution

| 项目     | 姓名 1 | 姓名 2 | 姓名 3 | 姓名 4 | 姓名 5 |
| -------- | ------ | ------ | ------ | ------ | ------ |
| 组织协调 | 20%    | 20%    | 20%    | 20%    | 20%    |
| 作品创意 | 25%    | 25%    | 25%    | 15%    | 10%    |
| 竞品分析 | 20%    | 20%    | 20%    | 20%    | 20%    |
| 方案设计 | 30%    | 30%    | 20%    | 10%    | 10%    |
| 技术实现 | 40%    | 30%    | 20%    | 5%     | 5%     |
| 文献阅读 | 10%    | 10%    | 10%    | 10%    | 10%    |
| 测试分析 | 20%    | 20%    | 20%    | 20%    | 20%    |

## 开发制作平台 Development Platform

- **操作系统**：Windows
- **开发工具**：Node.js, React, MongoDB, TypeScript, WebRTC

## 提交内容 Submission Contents

1. **素材压缩包**：包含所有相关素材。
2. **报告文档**：详细的设计与开发文档。
3. **演示视频**：展示作品功能的视频。
4. **PPT**：答辩演示文档。
5. **源代码**：完整的前后端代码。
6. **部署文件**：包含安装和运行说明的文件。

## 参考文献 References

1. WebRTC Standards: https://webrtc.org/
2. Edge TTS Documentation: https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/
3. DeepSeek AI Documentation: https://platform.deepseek.com/docs
4. React Documentation: https://react.dev/
5. Socket.IO Documentation: https://socket.io/docs/v4/
