# 鲸鱼叫声音频文件

此目录用于存放鲸鱼按钮的音频文件。请添加以下5个音频文件：

## 所需文件

1. **whale-call-1.mp3** - 座头鲸低沉悠长鸣叫
2. **whale-call-2.mp3** - 蓝鲸超低频脉冲  
3. **whale-call-3.mp3** - 白鲸高频哨音
4. **whale-call-4.mp3** - 座头鲸歌唱片段
5. **whale-call-5.mp3** - 虎鲸点击音序列

## 音频规格要求

- **格式**: MP3 (128kbps) 或 OGG
- **时长**: 3-6 秒
- **音量**: 归一化到 -3dB（避免削波失真）
- **采样率**: 44.1kHz 或 48kHz
- **清理**: 去除背景杂音，保留自然混响

## 推荐音频来源

### 免费资源网站

1. **Freesound.org**
   - 网址: https://freesound.org
   - 搜索关键词: `humpback whale`, `blue whale call`, `beluga whale`, `orca vocalization`
   - 许可证: 选择 CC0 或 CC-BY（需注明出处）

2. **BBC Sound Effects**
   - 网址: https://sound-effects.bbcrewind.co.uk
   - 搜索关键词: `whale`, `ocean`, `marine mammal`
   - 许可证: RemArc License（免费供个人和教育用途）

3. **Monterey Bay Aquarium Research Institute (MBARI)**
   - 网址: https://www.mbari.org/products/multimedia
   - 科研级水下录音，真实度极高

4. **国际鲸类研究机构**
   - Whale and Dolphin Conservation (WDC)
   - Ocean Networks Canada

### 搜索技巧

- **座头鲸**: "humpback whale song" (空灵婉转)
- **蓝鲸**: "blue whale call" (超低频，深沉)
- **白鲸**: "beluga whale vocalization" (高频哨音，清亮)
- **虎鲸**: "orca click" 或 "killer whale call" (节奏感强)

### 音频编辑工具

推荐使用 **Audacity** (免费开源) 进行音频处理：
1. 裁剪至 3-6 秒
2. 效果 → 归一化 → -3dB
3. 效果 → 噪声消除（可选）
4. 导出为 MP3 (128kbps)

## 降级方案

如果未提供音频文件，系统将自动使用程序合成的鲸鱼音效作为降级方案，无需担心功能失效。

## 版权声明

请确保所使用的音频文件符合 CC0、CC-BY 或其他允许商业使用的许可证。如使用 CC-BY 许可的音频，请在项目的 CREDITS 文件中注明作者和来源。

---

**提示**: 音频文件就绪后，重启开发服务器 (`npm run dev`) 即可生效。浏览器控制台会显示 "Whale audio X loaded" 日志确认加载成功。
