# AI Fit Lab 下一阶段 Agent 工作交付文档

> 交付日期：2026-09-18  
> 面向对象：接手产品、UI、前端、后端、视觉算法或比赛材料的 Agent  
> 当前性质：参赛用移动端 H5 原型，尚非生产系统  
> 当前主分支：`main`  
> 当前交付提交：`f789d3f Refresh magazine wardrobe experience`

## 1. 代码库和访问地址

- GitHub 仓库：<https://github.com/Er18-w/ai-fit-lab-v1>
- Git 克隆地址：`https://github.com/Er18-w/ai-fit-lab-v1.git`
- 线上演示：<https://er18-w.github.io/ai-fit-lab-v1/?deploy=f789d3f>
- GitHub Pages 工作流：`.github/workflows/pages.yml`
- 默认分支：`main`
- 当前本地目录：`E:\OpenCode\Project\ai-fit-lab-v1`
- 网站源码目录：`apps/web`

向 `main` 推送 `apps/web/**` 后，GitHub Actions 会自动将 `apps/web` 部署到 GitHub Pages。

## 2. 项目一句话定义

AI Fit Lab 是一个以“电子衣橱 + 个人数字档案”为基础的个人外形管理 Agent。当前首先解决两件事：

1. 将用户购买过或自己拍摄的衣服整理成电子衣橱，并支持日常搭配；
2. 根据用户照片、身高体重、可选身体尺寸、商品尺码表和期望穿着效果，提供候选尺码及上身效果解释。

长期目标是把衣橱、身体变化、虚拟试穿、健身方向、发型、面部美容和皮肤记录整合为一个持续更新的个人数字形象管理系统。

## 3. 用户真正想实现的效果

### 3.1 当前参赛重点

- 用户可上传商品图，也可拍摄自己已有的衣物；
- 系统检测图片亮度、对比度和分辨率，对暗光图片做基础增强；
- 系统抠出衣物并整理为独立单品，用户确认名称、分类和颜色后加入衣橱；
- 用户可以在衣橱中选择衣物、组合搭配并保存；
- 用户上传标准正面全身照，系统建立基础身体比例档案；
- 用户购买新衣时选择修身、合体、微宽松、宽松或 Oversize；
- 系统结合身体信息与商品尺寸，解释肩线、胸围松量和衣长，并给出候选尺码；
- 后续接入 AI 换装后，生成用户穿上目标衣服的视觉参考图。

### 3.2 长期效果

- 建立用户的二维或数字基础形象；
- 用户输入希望变瘦、增肌或改善体态的方向；
- 系统提供非医疗性质的身体变化方向和训练建议，并生成目标效果参考图；
- 增加发型定制、发色、眉形、眼镜、面部美容和皮肤状态管理；
- 所有能力共享同一个个人档案，而不是多个互不关联的小工具。

### 3.3 关键产品边界

- AI 图片是“视觉参考”，不能作为真实测量依据；
- 单张普通 RGB 照片不能可靠恢复胸围、腰围和臀围；
- 缺少可靠胸围时只能给候选尺码，不能承诺唯一正确尺码；
- 身体、皮肤、体态和健身建议不得包装成医疗诊断；
- 原图、实验估算、人工测量、商品尺寸和 AI 生成图必须明确区分。

## 4. 当前已经实现

### 4.1 电子衣橱

- 商品图导入和相机拍摄两个入口；
- 图片亮度、对比度和分辨率检测；
- 暗光图片基础提亮；
- 简单本地背景估算，以及可切换服务器处理的统一接口；
- 原图与处理图对比；
- 名称、分类和颜色确认；
- 衣橱分类、单品选择、搭配画布、拖动、清空、自动排版和保存搭配；
- 自定义衣物和搭配使用 `localStorage` 保存。

### 4.2 身体档案

- 身高、体重、年龄、常购男装/女装/中性体系；
- 肩宽、胸围、腰围、臀围、臂长、腿内长、脚长和前掌宽选填；
- 浏览器相机和相册上传；
- MediaPipe Pose 拍摄引导和关键点分析；
- 输出头身比例、上下身比例、肩线状态、姿态肩点跨度、投影臂长和投影腿长实验区间；
- 原始照片和二维基础形象分开保存。

### 4.3 尺码与穿着效果

- 五档目标穿着效果；
- 短袖 T 恤 M 至 3XL 示例尺码表；
- 根据胸围松量、肩宽差和衣长/身高比例输出解释；
- 有可靠胸围时排序推荐，缺少胸围时降级为候选尺码；
- 独立规则引擎位于 `packages/fit-engine`，但网页仍有一套简化内联逻辑，后续应统一。

### 4.4 试穿和外形探索

- 真人照片选择和当前衣橱搭配选择；
- AI 试穿排队、处理中和完成状态为 Mock；
- 发型、发色、面部、皮肤、身形和体态页面为交互原型；
- 真实生图、发型模拟、美容分析和皮肤模型尚未接入。

### 4.5 当前 UI

- 当前参赛版采用移动端秋季杂志、撕纸、拍立得和手写字体方向；
- 主要页面包括首页、衣橱、试穿、探索和我的；
- 设计参考是用户在对话中提供的六张手机页面图片；
- 用户要求尽量按参考图完整复刻，而不是只做“类似杂志风”；
- 当前部署版已经重构，但用户明确表示后续仍有较多 UI 细节需要调整；下一个 Agent 不应把当前 UI 当成最终稿。

## 5. 当前仍是 Mock 或未实现

- 没有后端、账号、数据库或云端对象存储；
- 没有真实 AI 换装和生图；
- 没有真实商品尺码表 OCR；
- 没有自动商品链接解析；
- 没有经过真人校准的围度估算；
- 没有真实训练、体态改善、美容或皮肤建议模型；
- 衣物分类和颜色识别目前主要由用户确认；
- GitHub Pages 上未运行 `rembg`，衣物抠图使用本地简化流程；
- 页面数据主要保存在浏览器 `localStorage`，清理浏览器后会丢失；
- 示例匹配分数和部分商品信息是假数据。

## 6. 推荐的开源技术路线

### 6.1 衣物图片处理

- 主方案：<https://github.com/danielgatis/rembg>，MIT；
- 高清抠图候选：<https://github.com/ZhengPeng7/BiRefNet>，MIT；
- 图片恢复候选：<https://github.com/xinntao/Real-ESRGAN>，BSD-3-Clause；
- 当前适配说明：`docs/GARMENT_IMAGE_PIPELINE.md`；
- 浏览器接口：`apps/web/garment-processor.js`。

服务器准备好后可先运行：

```bash
pip install "rembg[cpu,cli]"
rembg s --host 0.0.0.0 --port 7000 --no-ui
```

前端可通过 `window.GARMENT_API_URL` 指向 `/api/remove`。生产版本仍建议增加自有 API 层，负责鉴权、质量检测、存储、任务状态和统一 JSON 返回。

### 6.2 真人换装

后续重点比较：

- CatVTON：<https://github.com/Zheng-Chong/CatVTON>
- IDM-VTON：<https://github.com/yisol/IDM-VTON>
- OOTDiffusion：<https://github.com/levihsu/OOTDiffusion>

这些模型需要 GPU 服务器，不适合直接放在 GitHub Pages。模型及权重可能有独立许可证，商用前必须复核。

### 6.3 人体分析

- 当前使用 MediaPipe Pose；
- 详细边界见 `docs/MEASUREMENT_CONTRACT.md`；
- 照片估算当前只能作为实验比例和长度区间；
- 身高用于像素到厘米的二维标定，体重不参与长度计算；
- 正面加侧面、多帧汇总和真人软尺校准是下一阶段必要工作。

## 7. 关键代码位置

| 路径 | 作用 |
|---|---|
| `apps/web/index.html` | 所有页面结构和弹窗 |
| `apps/web/app.js` | 页面状态、路由、衣橱、搭配、尺码、试穿和档案逻辑 |
| `apps/web/styles.css` | 原始基础样式 |
| `apps/web/framework.css` | 原始组件样式 |
| `apps/web/v2.css` | 衣橱、弹窗和外形页面补充样式 |
| `apps/web/magazine.css` | 第一轮杂志视觉覆盖层 |
| `apps/web/reference-replica.css` | 当前参考图复刻覆盖层，优先级最高 |
| `apps/web/magazine-motion.js` | Lucide 初始化、渐显和桌面卡片轻微倾斜 |
| `apps/web/garment-processor.js` | 衣物图片质量检测、本地降级和 HTTP 处理适配器 |
| `apps/web/capture-coach.js` | 相机、传感器和 MediaPipe 拍摄引导 |
| `apps/web/body-estimator.js` | 身高标定的实验二维尺寸区间 |
| `packages/fit-engine/src/engine.js` | 独立可测试的短袖规则引擎 |
| `docs/MEASUREMENT_CONTRACT.md` | 人体视觉量体合同和风险边界 |
| `docs/GARMENT_IMAGE_PIPELINE.md` | 衣物增强、抠图和服务器接口方案 |
| `PROJECT_HANDOFF.md` | 早期详细 POC 方案，仅作历史技术参考 |

注意：当前 CSS 通过五个文件层叠覆盖，维护成本较高。继续精修 UI 前，建议在确保视觉不回退的前提下合并为基础样式与页面样式两层；不要先做无关重构。

## 8. 本地运行与测试

项目是纯静态网页，不需要安装 npm 依赖或构建。

```powershell
python -m http.server 4174 --directory apps/web
```

打开：<http://localhost:4174/>

运行测试：

```powershell
node --test "apps/web/test/*.test.js"
node --test "packages/fit-engine/test/*.test.js"
node --check "apps/web/app.js"
node --check "apps/web/garment-processor.js"
node --check "apps/web/magazine-motion.js"
```

当前交付时共 14 项测试通过。

## 9. 部署方式

工作流 `.github/workflows/pages.yml` 监听 `main` 分支中 `apps/web/**` 的变化，并直接部署该目录。

推送前必须：

1. 检查 `git status` 和 `git diff`；
2. 运行全部 14 项测试和 JavaScript 语法检查；
3. 不提交 API 密钥、用户照片或本地测试产物；
4. 推送 `main` 后检查 GitHub Actions；
5. 使用查询参数检查新版本，例如 `?deploy=<commit>`，避免浏览器旧缓存。

## 10. 下一阶段优先级

### P0：参赛演示稳定性

1. 让用户重新提供六张 UI 参考图原文件或可访问链接；
2. 在 `390 × 844` 视口逐屏截图对照，修正布局、字号、人物裁切、拍立得位置、撕纸区域和信息密度；
3. 验证首页、衣橱、试穿、探索、我的和商品尺码链路；
4. 验证真实手机上的 GitHub Pages 相机、上传、滚动和弹窗；
5. 修正所有横向溢出和文字遮挡；
6. 准备无网络或模型加载失败时的比赛演示降级路径。

### P1：统一尺码链路

1. 将网页 `calculateFit()` 改为调用 `packages/fit-engine` 的同一套规则；
2. 增加基于身高、体重和常购体系的低可信度候选尺码档位；
3. 明确该档位只是候选，胸围仍是上装唯一推荐的关键输入；
4. 增加商品尺码表手工编辑和用户确认；
5. 后续再接 PaddleOCR 或视觉模型解析。

### P2：衣物处理服务

1. 部署自有 `/api/garments/process`；
2. 接入 rembg/BiRefNet；
3. 对偏暗图片做真实增强；
4. 严重模糊、遮挡、残缺或过曝时要求重拍；
5. 如果未来提供 AI 重绘，必须保留原图并标注“AI 整理图”，避免改变真实花纹、纽扣和版型。

### P3：AI 试穿和数字形象

1. 部署并比较 CatVTON、IDM-VTON 和 OOTDiffusion；
2. 记录人物身份保持、商品细节保持、耗时、显存和单次成本；
3. 前端使用异步任务，不要让页面直接持有第三方密钥；
4. 生图失败不能影响尺码计算结果；
5. 所有生成结果必须标注“视觉参考”。

## 11. 已知风险

- 当前页面视觉素材来自 Unsplash/Pexels 及原型期 Pinterest 参考，正式商用必须重新确认许可证并替换 Pinterest 临时素材；
- 身体照片属于敏感数据，正式版需要明确授权、删除机制、访问控制和数据最小化；
- 普通照片量体尚未完成真人校准，不能宣传为精准量体；
- AI 换装可能改变脸部、身体、纹理和服装细节；
- 目前没有后端，不能安全保存任何商业 API 密钥；
- 当前 UI 样式覆盖层较多，修改时容易出现桌面和移动端回归；
- 产品长期范围较大，下一阶段必须守住“电子衣橱 + 尺码与穿着效果”这一核心闭环。

## 12. 给接手 Agent 的直接任务提示

可将下面文字直接作为新 Agent 的首条任务：

```text
请先阅读 NEXT_AGENT_HANDOFF.md、docs/MEASUREMENT_CONTRACT.md 和
docs/GARMENT_IMAGE_PIPELINE.md，再运行项目和全部测试。

这是 AI Fit Lab 参赛移动端 H5。代码库：
https://github.com/Er18-w/ai-fit-lab-v1

当前核心目标是完善“电子衣橱 + 上传照片建立身体档案 + 商品尺码与
穿着效果建议 + AI 试穿入口”。不要把 AI 生成图当作真实测量结果。

UI 必须以用户提供的六张秋季杂志风手机参考图为准逐屏对照，不能只做
泛化的杂志风。先检查现有实现和截图，再最小范围修改。保留衣物上传、
质量检测、抠图适配、衣橱搭配、身体档案和尺码规则。完成后运行全部测试，
使用 Playwright 验证 390×844 移动端和桌面端，并列出真实能力与 Mock 边界。
```

## 13. 交付状态

```text
GitHub 仓库：已推送
GitHub Pages：已部署
参赛 UI：已完成一轮参考图方向重构，仍需精修
电子衣橱：可演示
衣物图片处理：本地降级可演示，真实服务待部署
身体照片分析：实验能力可演示
尺码解释：短袖示例可演示，真实商品 OCR 待接入
AI 试穿：流程 Mock，真实模型待部署
发型/美容/皮肤：长期规划和交互原型
测试：14 项通过
```
