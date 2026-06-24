# i18n — changelog 中文译文（构建期产物）

[English](README.md) | **中文**

站点 Changelog 标签页的 bullets 是 `anthropics/claude-code` 官方发布说明的**逐字英文引用**（见 `../../corpus/changelog/`）。中文译文在**构建期**生成、入库前人工校对，线上没有运行时翻译，无译文的条目在 zh 界面安静回退为英文原文并标注说明。

## 存储：按内容寻址，增量

`changelog-zh.map.json` 把**每条英文原文**映射到校对后的中文：

- 新版本发布 → 只新增键；已有译文永不重复劳动；
- 上游修订某条原文 → 恰好孤立那一个旧键，过期译文不可能挂到新文本上；
- 同一条目跨版本复用（常见）→ 只译一次。

## 增量工作流（agent 在会话内的标准操作）

本项目由 agent 驱动维护——CLI 即 agent 的操作界面：全部基于文件、原子生效、stdout/退出码可机读，内部不调用任何模型。翻译由会话内的 agent（或人类）完成。

```bash
# 0. 看现状(只读,不写任何文件，--json 读输出)
node site/scripts/build-changelog-zh.js --status

# 1. 生成未译工单(可限定最新 N 个有条目的版本)
node site/scripts/build-changelog-zh.js --missing todo.json --limit-versions 5

# 2. 翻译。两种填法:
#    a) 小批量:直接在 todo.json 里把 null 改成译文(只改值，不碰键);
#    b) 大批量(推荐):另写一个与工单键序相同的纯译文 JSON 数组 list.json,
#       英文长键零转写——顺序即契约,条数不符整单拒绝。
#    翻译约束的完整版在 STYLE.md(硬规则/标点细则/逐字保留清单/术语表/句式)——
#    执行翻译前先读它;摘要:行内 `code`、URL、产品名逐字保留，** 数量一致,
#    界面引语保持英文字面量,中文分隔用全角(lint 拒绝贴中文的半角 ,;),
#    技术字面量(码段内 `,`/`;`、OSC 9;4、千分位)保持半角。

# 3.(可选)先验后存:只 lint 不落盘
node site/scripts/build-changelog-zh.js --check todo.json

# 4. 合并 + 烘焙(lint 硬闸:不过则整单拒绝、exit 1、逐条打印违规)
node site/scripts/build-changelog-zh.js --apply todo.json            # 填法 a
node site/scripts/build-changelog-zh.js --apply-list list.json todo.json  # 填法 b
```

直接跑 `node site/scripts/build-changelog-zh.js` 只烘焙 `../public/changelog-zh.js`（生成物，不入库）并报告覆盖率。map 中的非法条目会被跳过（按未译处理），不会卡住数据管线。apply 幂等：重复应用同一份文件 = `0 added, 0 changed`。

英文原文永远是权威版本，UI 在 zh 下默认展示译文，一键切回原文。
