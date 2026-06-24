# 安全与隐私问题上报

[English](SECURITY.md) | **中文**

本仓库的语料（`corpus/`）在入库前已经经过多层脱敏（见 [sanitize/README.zh-CN.md](sanitize/README.zh-CN.md)）。如果依旧在**任何已发布的数据里发现疑似残留的个人信息**（邮箱、账号/设备标识、本机路径、密钥等）：

1. **请勿在公开 issue 里张贴原值。**
2. 优先通过 GitHub 的 **Private vulnerability reporting**（仓库 Security 标签页）提交；若该入口未开放，请开一个只描述「位置 + 类型」（不含原值）的 issue。
3. 确认后会尽快移除并重写受影响数据，必要时清理历史。

代码类安全问题（如脱敏器绕过、闸门失效）同样适用上述渠道。
