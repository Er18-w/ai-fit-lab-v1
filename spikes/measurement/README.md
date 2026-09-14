# 量体风险 Spike

无云服务、无模型依赖的实验壳。当前关键点由用户手工标注，`ManualLandmarkAdapter` 明确标记为 mock；后续可替换为 MediaPipe 适配器。

在项目根目录运行 `python -m http.server 8080 --directory spikes/measurement`，访问 `http://localhost:8080`。相机权限通常只在 HTTPS 或 localhost 生效。

运行测试：`node --test spikes/measurement/test/measurement.test.mjs`。

输出的 `experimentalHeightScaledSpanCm` 只是身高线性标定后的姿态关键点跨度，不是真实体表肩宽，也不是成衣肩宽。
