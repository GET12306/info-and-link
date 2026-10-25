# 迷子集会：林鼓子（椎名立希 役）出演回数核对

核对日期：2026-10-21。此档案针对林鼓子本人主持、以及以椎名立希名义主持的回数。

## 官方来源与覆盖范围

- [官方播放列表](https://www.youtube.com/playlist?list=PLUFFl4hYd1R0SQPSCAqPVuT5F2By4pqO7)：207 个条目。
- 200 个公开视频为第 1～200 回，编号连续、无缺号；已逐一读取各视频的日文简介与公开时间。
- 86 回在当回简介的 `パーソナリティ` 栏明确列出 `林鼓子` 或 `立希`，已收录到 `src/data/activity-schedules/maigo-center.yaml` 的通用 `performances` 场次中。
- 其余 114 个公开编号回数的主持栏未列出上述名字，不收录到鼓子的出演档案。
- 另有 7 个条目为私密视频，不能读取标题、公开时间或主持信息；不推测回数、出演者或是否重复，也不计入已确认的 86 回。
- 本次只读取公开视频页面的元数据，没有下载音视频。完整核对事实保存在 [maigo-center.json](maigo-center.json)，包含每一回的来源 URL、主持栏、源时间戳、JST 时间和是否收录。

## 如何判断出演

只核对当回简介中的 `パーソナリティ` 栏。角色回以 `立希` 为依据，声优回以 `林鼓子`（或带角色括注的姓名）为依据。节目介绍、宣传段落、关键字和全员宣传图片不作为本回出演依据。

特别注意：第 143 回官方主持栏把角色与演员的括注位置写反，但仍明确同时包含林鼓子与椎名立希，因此收录；本站没有把这个源文错误复制成节目说明。

第 188、189、198、199 回分别对应原有的 2026-07-22、2026-07-29、2026-09-30、2026-10-07 四个日期；迁移时保留了原日期，并补齐回数与链接。

## 两种更新时间

1. **节目通常更新时间**：`activities.yaml → description`。官方 [节目介绍页](https://bang-dream.com/media/mygocenter_radio/) 公布每周三晚 7 点更新，页面显示每周三 19:00，不附加时区标识。仅用于说明，不生成鼓子的未来出演。
2. **某一回实际公开时间**：`activity-schedules/maigo-center.yaml → performances[].startAt`。读取 YouTube 页面 `playerMicroformatRenderer.publishDate`，按源时间戳中的 UTC 偏移转换为日本时间，截取到分钟。保留实际延迟或提前，不统一套用 19:00。例如第 23 回为 2023-05-24 18:00 JST，第 56 回为 2024-01-10 19:10 JST。

公开时间按视频的公开字段保存，不以周次倒推，也不使用文件上传日期来代替。个别条目的秒数被截去，这是当前网站精确到分钟的数据格式所限。

## 无法核对的私密条目

- [u8A0iMuk39Q](https://www.youtube.com/watch?v=u8A0iMuk39Q)
- [P7Xedj8mzks](https://www.youtube.com/watch?v=P7Xedj8mzks)
- [LLOD1ZGkPkE](https://www.youtube.com/watch?v=LLOD1ZGkPkE)
- [s4Oss4cMacA](https://www.youtube.com/watch?v=s4Oss4cMacA)
- [0HklC3CSufw](https://www.youtube.com/watch?v=0HklC3CSufw)
- [VM2fwBCQfjI](https://www.youtube.com/watch?v=VM2fwBCQfjI)
- [Tbu9x6gHEvI](https://www.youtube.com/watch?v=Tbu9x6gHEvI)

## 后续补充

新的已确认出演可在活动编辑器中选择迷子集会，使用通用场次表单添加 `startAt`、`episode` 和 `link`；保存会自动写入 `activity-schedules/maigo-center.yaml`。只知道日期时改用 `occursOn`。通常更新规律和提示统一修改活动 `description`。网页只读取 YAML，不读取本核对 JSON；`included: false` 和私密条目继续保留在 JSON 中备查，不需要为网页维护两份出演列表。

本次核对是一个截至上述日期的快照；不代表播放列表未来新增内容已被自动核对。私密视频未来公开、或官方更正主持名单时，应重新确认并更新本记录。
