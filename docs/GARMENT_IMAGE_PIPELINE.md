# 衣物图片处理方案

状态：前端流程已接入；服务器模型待部署。

## 开源组件选择

- 抠图主方案：[danielgatis/rembg](https://github.com/danielgatis/rembg)，MIT。项目提供 Python 库、CLI、HTTP 服务和 Docker 用法。服务器首选 `birefnet-general-lite`，低配置机器可先用 `u2net`。模型权重可能有独立许可证，部署前必须再次核对。
- 高分辨率抠图候选：[ZhengPeng7/BiRefNet](https://github.com/ZhengPeng7/BiRefNet)，MIT。先通过 rembg 的 ONNX 模型接入，避免维护两套服务。
- 图像恢复候选：[xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)，BSD-3-Clause。只用于降噪和低分辨率恢复，不负责改变衣物结构。
- 暂不采用 `imgly/background-removal-js` 作为主方案。它可以在浏览器端运行，但采用 AGPL-3.0，移动端首次模型下载和内存成本也更高。

## 前端接口

`apps/web/garment-processor.js` 暴露：

```js
GarmentProcessor.processGarment({ file, source, endpoint, onProgress })
```

未配置 `endpoint` 时，Demo 在本地完成基础质量检测、提亮和简单背景估算。配置 `window.GARMENT_API_URL` 后，前端会提交 `multipart/form-data`。接口可以返回下方统一 JSON，也可以直接返回 `image/png`；因此开发环境可直接指向 rembg 自带的 `/api/remove`：

```html
<script>window.GARMENT_API_URL = "http://localhost:7000/api/remove";</script>
```

请求字段：

```text
image=<file>
source=camera|product_image
operations=quality,enhance,remove_background,classify
```

正式服务器建议返回：

```json
{
  "status": "completed",
  "provider": "rembg-birefnet-general-lite",
  "quality": {
    "accepted": true,
    "brightness": 112,
    "contrast": 41,
    "warnings": []
  },
  "garment": {
    "name": "黑色针织上衣",
    "category": "top",
    "color": "黑色"
  },
  "images": {
    "enhanced": "https://...",
    "transparent": "https://...",
    "preview": "https://..."
  }
}
```

## 服务器部署顺序

1. 用 `rembg` 自带 HTTP 服务验证 20–30 张真实衣物图片。

```bash
pip install "rembg[cpu,cli]"
rembg s --host 0.0.0.0 --port 7000 --no-ui
```

2. 为当前接口增加一层轻量服务，负责质量检测、调用 rembg、存储结果和返回统一 JSON。
3. 暗光照片先做曝光和白平衡修正；严重模糊、遮挡或过曝直接要求重拍。
4. 确有需求后再加入 Real-ESRGAN，禁止用生成模型凭空补衣物图案、纽扣或版型。
