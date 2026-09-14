# 人体视觉量体合同（实验版）

版本：`measurement-contract-0.1.0`；状态：风险 Spike，未完成真人校准，不可用于生产尺码推荐。

## 边界

本合同只验证移动浏览器采集、关键点、质量拒绝、身高图像标定和多帧汇总的数据链路，不声称普通 RGB 相机已经能得到可靠厘米尺寸。当前使用手工关键点 mock；MediaPipe 尚未接入。未来适配器必须记录模型版本、逐点置信度和坐标变换。

## 不得混用的肩部字段

| 字段 | 定义 | 当前状态 |
|---|---|---|
| `pose_landmark_shoulder_span` | 姿态模型左右肩语义点的图像跨度 | 当前为手工 mock |
| `body_visual_shoulder_width_cm` | 轮廓/映射模型估计的视觉体表肩宽 | 尚未实现，需真人校准 |
| `body_biacromial_width_cm` | 左右肩峰间人工软尺真值 | 预实验人工采集 |
| `garment_seam_to_seam_shoulder_cm` | 成衣平铺两肩缝间宽度 | 来自商品或人工量衣 |

四者不可直接互换。只有真人配对数据验证后，才允许建立映射；成衣肩宽还必须结合正肩、落肩或插肩袖型。

## 输入与输出

每帧输入至少包含图像宽高、已知身高，以及 `headTop`、`footBottom`、`leftShoulder`、`rightShoulder` 四个同坐标空间关键点。会话应记录同意状态、设备、浏览器、1×/未知镜头、拍摄协议版本和配置版本。

拒绝结果包含 `accepted: false` 和结构化 `reasons`。关键点缺失、分辨率不足、人物过小/过大、关键点近边缘或肩线倾斜超阈值时，不得静默填补。

实验计算为：

```text
cm_per_pixel = known_height_cm / image_head_to_foot_distance_px
experimental_height_scaled_span_cm = pose_shoulder_pixel_span × cm_per_pixel
```

身高线性标定没有消除透视、人体深度、镜头畸变、衣物、站姿和标点误差。输出字段不得缩写为 `shoulder_width_cm`，界面不得称其为“你的肩宽”。配置生成的区间只是敏感性范围，不是统计置信区间。

多帧仅汇总通过质量门槛的同机位帧，使用中位数和 MAD 标记异常值；它只降噪，不构成多视角三维重建。不足配置帧数返回 `insufficient_frames`。

## 配置与复现

未经校准的阈值全部集中在 `spikes/measurement/src/config.js`，状态为 `UNCALIBRATED`。每条记录必须保存配置版本、适配器/模型版本、设备、协议、原始中间量和拒绝原因。阈值修改必须升级版本，不能为单个样本硬编码例外。

## 真人预实验模板

记录模板位于 `spikes/measurement/experiment-template.csv`。首轮建议 10–15 人、2–3 款手机、每人同一条件 3 次，人工记录真实身高、统一口径的 `body_biacromial_width_cm`、服装、机位、距离和光照。

必须报告有效帧数、自动拒绝率、中位绝对误差、P90 绝对误差、同人重复波动，以及按设备/距离/服装分组的误差。探索目标不是成功声明；若不达标，应要求手工肩宽或降级为体态比例提示。

## 后续接入门槛

接入 MediaPipe 前增加固定图片回归用例；接入后对比姿态肩点与人工肩峰点系统偏差，并在真实 iOS Safari、Android Chrome 测试权限和性能。预实验达标后，才讨论 `body_visual_shoulder_width_cm` 映射函数。
