# RGR 官网资料与林鼓子博物馆补全审计

调查日期：2026-11-01（日本时间）。本次只做资料调查与现状比对，没有修改网站代码或正式数据。

## 1. 范围与结论

遍历 [RGR 官网新闻](https://rungirlsrun.jp/news/) 的 24 个有内容的分页，得到 378 条唯一新闻记录；获取这 378 条新闻、9 个活动详情和 12 个发行详情，共 399 个详情页的公开 HTML，并对音乐、活动变更和下述候选项重点核读。另检查首页、Profile、Movie、Goods、らんがばん特设页及 Goods 列表链接的 16 个详情页。可复用的目录见同目录 `rgr-source-index.csv`。

来源目录合计 420 个唯一 URL。CSV 的分类是初筛建议，不是导入结果；`local_exact_url_references` 只表示现有 YAML 是否逐字引用同一网址，空白不代表活动不存在。`official_page_date` 是新闻／活动列表显示的文章日期，不能直接用作活动日或发行日。

边界：没有逐篇穷尽外链 Ameba 博客、X 历史帖或 YouTube 频道全部视频，也没有逐一播放视频、试听歌曲或核验所有商店和流媒体的现时可用性。图片里的成员长篇留言未作全文转录。此报告中的“目前已有／缺少”以本地 `src/data` 和页面代码为准，没有核对另一个线上部署版本。目录抓取成功不等于每个细节都已完成独立复核。

最值得优先做的事情：

1. 新增“音乐作品”馆：RGR 的 8 张单曲、1 张专辑、1 张迷你专辑，以及合集中的相关曲目。
2. 单独突出林鼓子独唱《点とミライ》，区分团体演唱、个人独唱、角色歌曲、演奏和现场翻唱。
3. 补入团体写真集《Run For You!》和有历史价值的影像／广播载体。
4. 在已有周年演出和发行活动上补场次、官方来源和相关资料；再补联合演出及早期节目。
5. 补齐取消／延期与资料可用性两套状态，建立 RGR 专题入口和条目间关联。

官网公告明确写的是 **2023-03-31 解散**；**2023-03-25 是 FINAL LIVE**，应分别保存。[解散公告](https://rungirlsrun.jp/news/detail.php?id=1101523)、[最终演出](https://rungirlsrun.jp/event/detail.php?id=1002423)。成立／公开发表日可追溯到 [2017-07-30](https://rungirlsrun.jp/news/detail.php?id=1051923)。

## 2. 当前博物馆的实际基础

本地读取到以下原始条目数；活动数包含未来活动和其他时期，并非全部是 RGR 或已结束的记录：

| 数据集 | 条数 | 本次发现 |
| --- | ---: | --- |
| activities | 222 | 已有主要周年演出、部分联合演出、发行活动、个人生日会及舞台 |
| programs | 26 | 已有多档 RGR 常规节目，但许多仅到年份、无可核对的来源／回次 |
| credits | 61 | 都是 `seed`，主要依据事务所履历；尚未标为作品官方复核 |
| photobooks | 3 | 均为个人出版物，没有《Run For You!》 |
| magazines | 6 | 目前没有 RGR 早期杂志资料 |
| notes | 9 | 大多是较近期采访，RGR 早期内容仍有补充空间 |
| archived-accounts | 3 | 已有 RGR 官方 YouTube、官方 X，以及ココいちばん账号 |
| daily-posts | 3 | 可以承接独立日常帖，但活动／发行相关帖应回挂对应条目 |

博物馆现有六个入口：出演作品、过去活动、节目企划、出版与文章、日常投稿、历史账号。**没有音乐作品集合、音乐路由或歌曲数据模型。** 不建议把歌曲塞进出演作品的 `medium: audio`，那里目前用于有声书、广播剧、Voice PV 等出演履历。

已经存在的 RGR 资料，不应重复创建：

- 2017 Showcase 三次；2018 首次巡演；2019 二周年及京都追加公演；2020 Online Live 四场；2021 四周年振替公演；2022 五周年六场；2023 FINAL 两场。
- 2018 Green Leaves Fes、TIF 2018、AnimeJAM 2018；2019 ANIMAX MUSIX OSAKA、C3 上海、三团情人节演出等。
- 2019 林鼓子生日活动「はやまるとあそぼう」、2021 19 岁生日线上活动、2022 20 岁生日 Live。
- 「らんがばん！」「らんがちゃんねる」「Share the Night」「3人4脚自由形」「Run Girls, Radio!／!!」「オールナイトニッポンi」等节目概览。
- 《林鼓子 ここから。》已有，且已引用 RGR 官网来源。

## 3. 音乐馆可直接建立的基础目录

建议名称为“音乐作品／Discography”，长期范围覆盖 RGR、个人、角色名义及其他企划，RGR 作为筛选或专题。歌曲和唱片分别建档：一首歌可以收录在多张唱片中，同一发行的 CD／MV／LIVE 版合并为版本，不重复算歌。

### 3.1 十个 RGR 主体发行

以下日期是官网列出的**唱片发行日**，不是动画首播日或 MV 公开日。表内列人声曲目；伴奏版另记为版本。

| 发行日 | 发行 | 可收录的人声曲目／重点 | 官方来源 |
| --- | --- | --- | --- |
| 2018-02-28 | スライドライド | スライドライド、サクラジェラート | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1015498) |
| 2018-05-02 | キラッとスタート | キラッとスタート、プリマ☆ドンナ？メモリアル！ | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1015643) |
| 2018-10-31 | Go! Up! スターダム！ | 同名主打、秋いろツイード | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1016018) |
| 2019-02-06 | Break the Blue!! / never-ending!! | 两首标题曲；应作为双主打发行 | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1016171) |
| 2019-05-29 | ダイヤモンドスマイル | 同名主打、青春アルゴリズム | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1016423) |
| 2019-11-27 | Share the light | 同名主打、キラリスト・ジュエリスト、スノウグライダー | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1017094) |
| 2020-05-20 | Run Girls, World！ | 14 首；除既有标题曲外，应补カケル×カケル、りんごの木、Darling Darling、水着とスイカ、逆さまのガウディ、イルミナージュ・ランド、ランガリング・シンガソング | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1017496) |
| 2020-12-16 | ルミナンスプリンセス | 同名主打、My Best Shine!! | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1017775) |
| 2021-05-19 | ドリーミング☆チャンネル！ | 同名主打、無限大ランナー | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1018294) |
| 2022-04-06 | Get set, Go ! | 团体曲 RADIANT、蒼穹のBlue Grandia、Believer Switch；林鼓子独唱 点とミライ；另外两首是其他成员独唱 | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1018766) |

按这十个发行页面去重、排除伴奏，得到 **30 首不同人声曲目**。其中《感情にダッシュ!》为森嶋優花独唱，《拝啓ディアナイト》为厚木那奈美独唱；初期“鼓子参与演唱”目录可以这 **27 首团体曲＋1 首个人独唱＝28 首**为基础。这是本次官网目录范围内的统计，不是林鼓子全部音乐履历的总数，也不代表已穷尽所有发行渠道。

《点とミライ》不能因为放在团体迷你专辑里，就隐藏其个人独唱属性；另外两人的 solo 可以保留在完整唱片曲目表中，但不应标为鼓子演唱。

### 3.2 出道曲与合集

[Wake Up, Best！3](https://rungirlsrun.jp/discography/detail.php?id=1015497)（2018-03-28）收录《カケル×カケル》。只关联其中的 RGR 曲目，不把整张合集的 WUG 曲目全部计为鼓子参与。

《カケル×カケル》还有 [2017-10-28 20:00 的 ANiUTa 先行配信公告](https://rungirlsrun.jp/news/detail.php?id=1055098)。这能说明数字先行与后来实体收录的区别；不可把 2018-03-28 直接写成歌曲首次发行日。2017-09-24 的官网试听公开又是另一个日期，应另存为试听公开事件。

### 3.3 音乐、动画和活动的关联

可从官方发行页建立：

- 《スライドライド》→《デスマーチからはじまる異世界狂想曲》OP。
- 《Break the Blue!!》→《ガーリー・エアフォース》OP。
- 《Share the light》→《アサシンズプライド》OP。
- 多首歌曲→《キラッとプリ☆チャン》不同阶段主题歌；保留时期，勿全部写成相同季度。
- 《カケル×カケル》→《Wake Up, Girls！新章》插入歌。
- 《プリマ☆ドンナ？メモリアル！》→剧场版主题歌线索，见 [官网主题歌公告](https://rungirlsrun.jp/news/detail.php?id=1060239)。

关联方式应让访客能从歌找到唱片、MV、动画与发行活动，也能从活动返回演唱曲目。RGR 艺人名义与桃山みらい等角色名义应分开，不能因为同一动画就合并成同一歌手。

音乐条目建议保存：稳定 ID、原文标题／检索别名、演唱名义、鼓子的参与角色、首次公开与首次发行日期、词曲编曲人员（有来源再填）、关联作品、唱片及版本、曲序、官方试听／MV／流媒体入口、来源、核对状态。首次公开、数字发行、实体发行、动画使用日期应能分别记录。

## 4. 影像、广播载体、写真与特别企划

| 资料 | 当前情况与建议 | 来源 |
| --- | --- | --- |
| 团体写真集《Run For You!》 | 本地未收录。A4 竖版、封面 4 页＋正文 96 页。2022-04-09～04-24 是公告中的门店销售期间，不能据此断言是首次发行日；和众筹阶段关联 | [销售公告](https://rungirlsrun.jp/news/detail.php?id=1099115)、[众筹公告](https://rungirlsrun.jp/news/detail.php?id=1094698) |
| らんがばん！4BD | 节目已有，实体影像载体未单独记录。2020-01-31 发行，全 12 回，并附 Green Leaves Fes 昼夜场影像 | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1017119) |
| 2020 Online Live 最终场影像 | 已有活动；补上 2021 年单曲 LIVE 版收录的 2020-10-11 17:30 场次，让人知道怎样找到正式影像 | [LIVE 版详情](https://rungirlsrun.jp/discography/detail.php?id=1018294) |
| 四周年最终公演及制作花絮 | 已有演出；与《Get set, Go !》LIVE 版关联。不要重复建成一场新演出 | [发行详情](https://rungirlsrun.jp/discography/detail.php?id=1018766) |
| オールナイトニッポンi スペシャルCD vol.1 | 节目已有，载体缺少。公告预计 2019-06-14 发行，音频 CD＋数据 DVD，含新录及历史节目资料；实际上市信息仍应复核 | [发行及公开录音公告](https://rungirlsrun.jp/news/detail.php?id=1071028) |
| USB MEMORIES 林鼓子版／团体版 | 保存商品资料及来源。内容包含回顾照片、视频和 FINAL 幕后，不是 FINAL 全场演唱会发行；2023-03-27 是公告日，3/31～4/9 是受注期间，7 月上旬是当时预计发货时间 | [官方公告](https://rungirlsrun.jp/news/detail.php?id=1107198) |
| 官方 MV／试听／舞蹈视频 | Movie 页只有 6 个入口，不能作为全量视频目录；还须结合发行页、新闻和官方频道 | [Movie](https://rungirlsrun.jp/movie/)、[成立时舞蹈视频公告](https://rungirlsrun.jp/news/detail.php?id=1051927) |
| Run Girls, Rock！成员选曲歌单 | 可记录鼓子的音乐偏好和本人短评；不能把选入的其他歌手作品计入其演唱履历 | [歌单公告](https://rungirlsrun.jp/news/detail.php?id=1099554) |
| 四周年回顾 setlist 歌单 | 很适合挂到四周年活动，作为曲目顺序的官方线索；是播放列表，不是新专辑或现场录音 | [官方歌单公告](https://rungirlsrun.jp/news/detail.php?id=1100247) |
| 2019 Dan Balls, Dan！企划 | 另记“愚人节特别企划”，可关联歌／广播／PDF／采访等公开资料；不写成真实改名或普通商业单曲 | [企划公告](https://rungirlsrun.jp/news/detail.php?id=1071347)、[歌曲企划](https://rungirlsrun.jp/news/detail.php?id=1071348)、[PDF 公告](https://rungirlsrun.jp/news/detail.php?id=1071349)、[采访入口](https://rungirlsrun.jp/news/detail.php?id=1071352) |

影像可先作为唱片版本或节目／活动的关联资料，不必立即新增一个空泛的“视频馆”。写真集沿用现有出版物馆；广播 CD 应归节目载体，避免和歌曲混算。

官网 [Goods](https://rungirlsrun.jp/goods/) 还有 16 个活动商品详情。团体活动及鼓子 19、20 岁生日场的服装、场刊、商品图等，可挂到对应活动；其他成员的纯个人生日商品不必全量纳入鼓子博物馆。

## 5. 活动：新增候选、已有补场次、已取消分开处理

下面“未见”表示本地活动标题／ID／日期对照后未发现对应条目；官方出演公告确认的是**当时的预定出演**。正式写成“已举行／实际出演”前，仍应找最终公告、报道或本人回顾；尤其疫情时期。时间不明就保存全天，不把整个音乐节开场时间当作鼓子的登台时间。

### 5.1 主要新增候选

| 活动日（公告给出） | 活动 | 本地比对／补录重点 | 来源 |
| --- | --- | --- | --- |
| 2017-12-06 | IDOL CONTENT EXPO 新宿 BLAZE 番外篇 | 未见；早期联合演出 | [公告](https://rungirlsrun.jp/news/detail.php?id=1056080) |
| 2017-12-25 | クリスマスだよ！RGR トーク＆お渡し会 | 未见；17:00，Animate 池袋 | [公告](https://rungirlsrun.jp/news/detail.php?id=1056492) |
| 2018-02-10 | ANIMAX MUSIX NEXTAGE | 未见；与 2019 OSAKA 分开 | [公告](https://rungirlsrun.jp/news/detail.php?id=1055935) |
| 2018-04-07 | キラッとスタート 阳光城喷泉广场活动 | 未见；不是现有 4/14～4/22 的店铺巡回场次 | [公告](https://rungirlsrun.jp/news/detail.php?id=1059642) |
| 2018-05-26 | Super★Premium vol.7 | 未见；勿与 2019 被取消的 vol.8 混淆 | [公告](https://rungirlsrun.jp/news/detail.php?id=1059988) |
| 2018-05-27 | @JAM 2018 | 未见；Zepp DiverCity | [公告](https://rungirlsrun.jp/news/detail.php?id=1059991) |
| 2018-06-02 | デスマーチからはじまる郊外狂想曲 | 未见；RGR 追加出演 | [公告](https://rungirlsrun.jp/news/detail.php?id=1061157) |
| 2018-06-03 | CIRCLE FIRE vol.3 | 未见；CLUB CITTA’ | [公告](https://rungirlsrun.jp/news/detail.php?id=1060048) |
| 2018-06-09 | 東京おもちゃショー2018 | 未见；两个舞台，需补各自时间 | [公告](https://rungirlsrun.jp/news/detail.php?id=1062002) |
| 2018-06-24 | わーすた Summer Tour 2018 嘉宾 | 未见；仙台 Rensa 第二部，不是 11 月秋祭手渡会 | [公告](https://rungirlsrun.jp/news/detail.php?id=1061992) |
| 2018-07-08 | アイドル横丁夏まつり!! | 未见；出演日是 7/8，不应导入音乐节全程 | [公告](https://rungirlsrun.jp/news/detail.php?id=1062042) |
| 2018-08-14 | まけんグミフェス2018 SUMMER | 未见；演出和当晚特典会可在同一活动关联 | [公告](https://rungirlsrun.jp/news/detail.php?id=1062978) |
| 2018-10-19 | 亜咲花 19th Birthday LIVE 嘉宾 | 未见；duo MUSIC EXCHANGE | [公告](https://rungirlsrun.jp/news/detail.php?id=1065303) |
| 2019-03-01、03-05 | みんなにありがとう！ミニライブ | 未见；服装制作企划相关，两天合并一个活动记录 | [公告](https://rungirlsrun.jp/news/detail.php?id=1070074) |
| 2019-04-21 | ANN i 特别 CD 公开录音 | 未见；不要与已有 1/22 广播公开录音合并 | [公告](https://rungirlsrun.jp/news/detail.php?id=1071028) |
| 2019-05-12、05-18 | ダイヤモンドスマイル 东京／大阪发行活动 | 未见这组；现有 5/15 个人生日和 5/19 免费活动是其他活动 | [公告](https://rungirlsrun.jp/news/detail.php?id=1071130) |
| 2019-10-26 | ANIMAX MUSIX 2019 KOBE | 未见；已有 OSAKA 不能覆盖神户 | [公告](https://rungirlsrun.jp/news/detail.php?id=1075693) |
| 2019-12-07 | 京 Premium Live 2019 | 未见；只录 RGR 的出演日 | [公告](https://rungirlsrun.jp/news/detail.php?id=1074686) |
| 2020-01-12 | らんがばん！BD 发行活动 | 未见；UDX，现场评论音轨、mini live 和手渡会 | [公告](https://rungirlsrun.jp/news/detail.php?id=1077829) |
| 2020-02-16 | Valentine ～For you～ | 未见；14:00／18:00 两场 | [活动页](https://rungirlsrun.jp/event/detail.php?id=1002104) |
| 2020-08-29 | a-nation online 2020 | 未见；White Stage，公告给 RGR 的时段为 14:20 | [公告](https://rungirlsrun.jp/news/detail.php?id=1085514) |
| 2020-11-03 | NOW ON AIR ONLINE LIVE 嘉宾 | 未见；RGR 仅出演 14:00 昼场 | [公告](https://rungirlsrun.jp/news/detail.php?id=1086203) |
| 2020-11-30 | H-POP to World | 未见；公告将 RGR 列在 Fashion Show，不能直接写成歌曲演出 | [公告](https://rungirlsrun.jp/news/detail.php?id=1087033) |
| 2020-12-13 | 京 Premium Live 2020 | 未见；RGR 在昼场 | [公告](https://rungirlsrun.jp/news/detail.php?id=1086899) |
| 2021-03-13 | White Day 2021 ～Give me～ | 未见；12:45／15:45／18:45 三场；与已取消的 2020 年活动分开 | [公告](https://rungirlsrun.jp/news/detail.php?id=1089337) |
| 2021-03-20 | マダミスマンション「ランガの部屋」 | 未见；16:00 场，游戏与 after talk，不是普通音乐 live | [公告](https://rungirlsrun.jp/news/detail.php?id=1090021) |
| 2021-03-27 | 帰ってきた！Run Girls, Radio!! | 未见；AnimeJapan 特别节目，15:30～16:30 | [公告](https://rungirlsrun.jp/news/detail.php?id=1090123) |
| 2021-06-13、07-17 | ドリーミング☆チャンネル！发行活动 | 未见；7/17 是原 4/25 活动的振替，不能同时算两次已举行 | [追加活动](https://rungirlsrun.jp/news/detail.php?id=1091859)、[振替通知](https://rungirlsrun.jp/news/detail.php?id=1091097) |
| 2021-08-28 | iDOL on-line SUPER SUMMER FESTIVAL | 未见；疫情及成员出演情况须作最终核实 | [公告](https://rungirlsrun.jp/news/detail.php?id=1092387) |
| 2021-11-23 | アニレヴ2021 | 未见；DAY2 | [公告](https://rungirlsrun.jp/news/detail.php?id=1093785) |
| 2021-11-28 | SACO FES | 未见；丰洲 PIT | [公告](https://rungirlsrun.jp/news/detail.php?id=1095191) |
| 2021-12-12 | 京 Premium Live 2021 | 未见；RGR 在③场，12:30 | [公告](https://rungirlsrun.jp/news/detail.php?id=1094800) |
| 2021-12-26 | 超！クリスマスパーティーLIVE！DAY2 | 未见；与后续 2022 年广播另记关联 | [公告](https://rungirlsrun.jp/news/detail.php?id=1096327) |
| 2022-02-06 | Wonder Festival 2022 冬 | 未见；与 2017 年公开发表、2022 夏季分开 | [公告](https://rungirlsrun.jp/news/detail.php?id=1097291) |
| 2022-03-06、04-09 | Get set, Go ! 发行活动 | 未见；各三回，4/9 含 mini live；两个日期内容不同 | [3/6](https://rungirlsrun.jp/news/detail.php?id=1097897)、[4/9](https://rungirlsrun.jp/news/detail.php?id=1098603) |
| 2022-07-18 | SPARK 2022 in YAMANAKAKO | 未见；只录 RGR 的 7/18 | [公告](https://rungirlsrun.jp/news/detail.php?id=1100672) |
| 2022-07-24 | Wonder Festival 2022 夏 | 未见；公告中出演具体时间未定，不能填 10:00 为登台时间 | [公告](https://rungirlsrun.jp/news/detail.php?id=1100453) |
| 2022-10-23 | トリコ△ボウル!!! | 未见；Science Hall | [公告](https://rungirlsrun.jp/news/detail.php?id=1103338) |
| 2022-12-11 | 京 Premium Live 2022 | 未见；RGR 在 12/11 | [公告](https://rungirlsrun.jp/news/detail.php?id=1102749) |
| 2023-01-15 | MUROMACHI SUPER LIVE 2023 | 未见；室町三井 Hall，音乐节总开场不等于 RGR 登台 | [公告](https://rungirlsrun.jp/news/detail.php?id=1105281) |
| 2023-02-12、03-12 | RGR ラスト特典会 | 未见；拍立得／合影，按日期及部次整理，不按每个号码段拆成活动 | [公告](https://rungirlsrun.jp/news/detail.php?id=1105512) |

这份表是可以执行的候选清单，不声称每一行都已完成“实际发生”的二次取证。网络签名会、チェキチャ、1on1 等还有更多记录，完整新闻目录可继续筛出；按发行系列归组，逐个确认哪一部有鼓子参与。例如 [2021-07-31 签名会](https://rungirlsrun.jp/news/detail.php?id=1092726) 的第三部只有另外两位成员，不能把三部全部算作鼓子出演。

### 5.2 已有条目应完善的具体位置

| 本地 ID／条目 | 对照结果 | 推荐动作 |
| --- | --- | --- |
| `2018-rgr-debut-first-anniversary-event` | 仅第一部 15:00；官网另列 18:00 第二部 | 核对鼓子参与后补第二部；[官网](https://rungirlsrun.jp/news/detail.php?id=1062796) |
| `2018-rgr-christmas-card-event` | 仅 13:00；官网列 13:00、16:00 | 补 16:00 的参与确认及场次；[官网](https://rungirlsrun.jp/news/detail.php?id=1067814) |
| `2022-rgr-valentine-event` | 目前标题明确为夜公演；官网同时有 14:00 昼场 | 确认并补昼场，可合并为一个活动的两场；[官网](https://rungirlsrun.jp/event/detail.php?id=1002297) |
| `2022-rgr-white-day-event` | 同上，只有 18:00 夜场 | 确认并补 14:00 昼场；[官网](https://rungirlsrun.jp/event/detail.php?id=1002297) |
| 2017 Showcase | 仅有日期，官网每个日期各列两部，共六场 | 9/24 为 16:15／18:45；10/28、11/25 均为 13:30／17:30。回看[原始公告](https://rungirlsrun.jp/news/detail.php?id=1051928)及后续变更，补场次与场地 |
| 2018 首次巡演 | 日期和场馆已有，时间缺失 | 初期新闻只有日期，需追最终场次信息，避免猜测 |
| `2021-run-girls-run-4th-anniversary-live` | 已正确使用 11/27、12/19 振替日期 | 保持现有日期，加延期来源及原定日期说明，挂正式影像／回顾歌单 |
| `2023-run-girls-run-final-live` | 日期和昼夜场已有 | 加广播／Z-aN 历史播放信息、影像状态、商品及幕后资料；不把过去付费直播写成现在可观看 |
| `2019-assassins-pride-share-the-light-release` | 已有发行相关活动 | 和 11/16 东京、12/8 京都的店铺手渡系列比对后再补，不因发行名相近就重复或误合并；[官网](https://rungirlsrun.jp/news/detail.php?id=1076303) |
| 2022 五周年决起集会 | 本地已有多城／多部次 | 补官网来源和音乐曲目线索，不重复新建；[官网](https://rungirlsrun.jp/news/detail.php?id=1100926) |

### 5.3 取消记录及容易误判的材料

| 项目 | 最终处理 | 来源 |
| --- | --- | --- |
| 2020-05-16 Coco's Music Journey | 鼓子生日活动被取消。原 Event 页仍保留售票和演出资料，必须关联取消公告 | [原页](https://rungirlsrun.jp/event/detail.php?id=1002121)、[取消](https://rungirlsrun.jp/news/detail.php?id=1082909) |
| 2020 三周年巡演 =夢へのバトン= | 全部取消，不能计入已演出场次 | [活动页](https://rungirlsrun.jp/event/detail.php?id=1002108)、[最终取消](https://rungirlsrun.jp/news/detail.php?id=1085852) |
| 2020 White Day | 原 3/7，改 6/14，最终取消；不能和 2021 同名活动混淆 | [活动页](https://rungirlsrun.jp/event/detail.php?id=1002107)、[取消](https://rungirlsrun.jp/news/detail.php?id=1083384) |
| 2019-10-12 Super★Premium vol.8 | RGR 官网有出演预告，但其他官方来源确认台风导致取消。这说明只读 RGR 原公告仍可能误导 | [原预告](https://rungirlsrun.jp/news/detail.php?id=1076140)、[出演者官网取消通知](https://www.yukimoeko.com/contents/273110)、[票务方取消清单](https://l-tike.com/news/mevent/?mid=479892) |
| 2021 四周年延期、发行活动延期 | 保留原计划作变更历史，实际公演用最终日期；成员缺席应到场次层说明 | [成员出演变更](https://rungirlsrun.jp/news/detail.php?id=1092940)、[发行活动振替](https://rungirlsrun.jp/news/detail.php?id=1091097) |
| 2019-04-01 Dan Balls 系列 | 愚人节企划，可入企划档案，不写成正式改名；真实公开的内容依然可以保存链接 | [官网](https://rungirlsrun.jp/news/detail.php?id=1071347) |
| 2017-07-29 三条 TEST 新闻 | 排除，不进博物馆 | [新闻最末页](https://rungirlsrun.jp/news/?page=24) |
| 其他成员个人舞台／生日会／健康公告 | 只有与鼓子实际参与或团体活动变更相关时才关联；不作为鼓子个人履历全量收录 | 各原公告 |

当前普通活动／场次没有完整的取消状态；`available/expired` 用于链接可用性，不能兼任活动是否举行。建议分离：活动状态（举行／取消／延期／待核实）、场次变更，以及来源／播放链接状态。

## 6. 节目、文章、账号的补全

| 项目 | 当前基础／缺口 | 可新增的确证信息 |
| --- | --- | --- |
| ライブダムカンパニー | 本地 programs 未见 | RGR 自 2018-07-14 #11 起隔月担任 MC；有原平台入口；终止日另核。[来源](https://rungirlsrun.jp/news/detail.php?id=1063342) |
| Run Girls, Run！のプレイリスト for You! | 本地未见 | 2019 年 ANiUTa 主持节目，不能只当普通歌单；可记录节目身份与历史平台。[来源](https://rungirlsrun.jp/news/detail.php?id=1069577) |
| 3人4脚自由形 | 已有，但只写 2019 | 官网确认 2019 年 12 月起、计划每月两次、YouTube／Niconico；2020 年仍有更新暂停公告，因此 2019 不是完整活动期间，结束日需另核。[开播](https://rungirlsrun.jp/news/detail.php?id=1078731)、[2020 公告](https://rungirlsrun.jp/news/detail.php?id=1082869) |
| Share the Night | 已有 2020，标 expired，无 URL | 可补官方开播来源、FM 横滨、每周三 25:30～26:00；广播日期和实际次日凌晨分别处理。[来源](https://rungirlsrun.jp/news/detail.php?id=1079518) |
| Run Girls, Radio! | 已有 2017，缺官方来源 | 官网给出 2017-10-03 开始；区分一个／两个惊叹号及特别复活节目。[来源](https://rungirlsrun.jp/news/detail.php?id=1053865) |
| オールナイトニッポンi | 已有 combined／独立节目，范围较粗 | CD 资料覆盖 2017-10～2019-03 的成员担当回；需区分与 WUG 联合时期和独立节目，不能直接把所有回次归一标题。[来源](https://rungirlsrun.jp/news/detail.php?id=1071028) |
| らんがばん！ | 已有概览，缺分回及载体关联 | 特设页仍列第 1～11 回概要，并出现第 9 回重复；BD 列全 12 回。因此可补逐回，但第 12 回来源要另找，不推造摘要或日期。[特设](https://rungirlsrun.jp/rungaban/)、[BD](https://rungirlsrun.jp/discography/detail.php?id=1017119) |
| らんがばん！历史配信 | 有特设链接，不代表节目可直接播放 | 可补 2022-05-12 Anime Times 上线公告；平台今日是否仍可播另核。[来源](https://rungirlsrun.jp/news/detail.php?id=1099794) |
| 周年／发行特别直播 | 多个未见独立记录 | 例如 2020-07-31 三周年、2020-09-09、2021-05-19 发行特番、2021-08-14 四周年、2021-12-17 演出前节目；按一次性节目记录，或回挂相关活动，避免重复计数。[三周年](https://rungirlsrun.jp/news/detail.php?id=1084890)、[发行特番](https://rungirlsrun.jp/news/detail.php?id=1091563)、[四周年](https://rungirlsrun.jp/news/detail.php?id=1093565) |
| 2018 游戏体验／新人记者企划 | notes 未见 | 官网直接给出 Animate Times 报道入口，可以补早期采访／活动报道；4/1 发布不代表全部都是虚构，需看具体内容。[采访入口](https://rungirlsrun.jp/news/detail.php?id=1060097)、[游戏报道](https://rungirlsrun.jp/news/detail.php?id=1060098) |
| 历史账号 | 已有官方 X／YouTube | 可补 RGR 官网作为资料站、[Ameba 官方博客](https://ameblo.jp/rungirlsrun/)、鼓子旧账号 [@rgr_coco](https://twitter.com/rgr_coco)、[Niconico 频道](https://ch.nicovideo.jp/RGR)。旧账号仍能打开不等于仍更新；具体使用时期应取证。[旧 Profile](https://rungirlsrun.jp/profile/) |

常规节目的“节目本体”“单回”“公开录音活动”“广播 CD／BD”应互相关联。节目不能播放时仍然展示可访问的官方告知来源，避免全部只剩 expired 标签。

节目状态目前混合了“链接能否访问”和“内容能否观看”，建议拆开：官方网站存在、视频公开／私密／删除、付费／地区限制、限期已结束、尚未核实。2022 年说“开始配信”也不能直接用来证明 2026 年仍可播放。

## 7. 博物馆本身还需要完善的地方

### 第一优先：分类与关联

1. 增加音乐馆入口及唱片／歌曲两种视图。按演唱名义、参与角色、年份、类型筛选。不要让同曲再录或多版本唱片制造重复统计。
2. 给 RGR 一个专题入口，显示 2017～2023 简短年表，并汇总音乐、活动、节目、出版物、账号。专题聚合既有条目，不另复制整套 RGR 数据。
3. 给活动、歌曲、唱片、节目、资料建立稳定关联。现有 `activity-resources.yaml` 很适合承接演出公告、商品、照片、视频和报道。
4. 参与角色不能只有“歌手”：角色曲、独唱、团体演唱、合唱、鼓手／其他演奏、talk、嘉宾、模特等要能区分。以后扩充 MyGO!!!!! 时尤其有用。

### 第二优先：事实状态与来源

5. 为节目／媒体／普通活动补来源、核对日期与核对状态。当前只有出演作品较完整地支持 `sources`／`verification`，且 61 条仍是 seed；这说明履历收录和作品官方复核是两个阶段。
6. 区分官网文章日期、实际活动日期、发行日期、受注期和发货期。不要按 News 的日期导入演出日，新闻可能被更新并保留早期排列位置。
7. 取消和延期保留历史，但单独显示，不计入已演出数量；已有活动过去了，并不自动代表成功举行。
8. 对纪念影像、私密／删除视频、流媒体限时存档、停止更新的账号分别标注，不统一使用“失效”。

### 第三优先：检索与浏览

9. 馆内关键词检索目前主要覆盖条目本身，**没有把活动／节目 `relatedResources` 的标题和说明纳入检索**。加入曲名、关联材料标题以及 RGR／Run Girls, Run!／ランガ等别名后，历史资料才容易找到。
10. 当前搜索结果多数回到集合页，没有定位具体条目；可沿用活动卡片已有 anchor，为歌曲、唱片、节目和出版物提供稳定定位。不要要求用户跳回上百条列表重新寻找。
11. 日期筛选目前是某个年／月／日匹配，不是区间语义；例如节目只有年份时，搜索某个月不会命中。可让“发生日期”和“节目播出期间”有不同检索规则。
12. 过去活动已有类型筛选和历史日历，保留即可；随资料量增加，再补年份与参与团体筛选。现阶段不需要重新做整个博物馆。

### 收录与保存原则

- 大量票务轮次、当日券、花篮、问诊表等公告，合并到原活动的参考资料中，不逐条生成新的博物馆藏品。
- 商品和衣装图可作为活动资料或发行版本信息；是否新增完整周边馆，取决于今后是否真的持续整理实物收藏。
- 保存官方来源 URL、页面标题、自己的事实摘要和核对日期；封面／图片另记来源与使用条件。正文、写真、歌曲、付费影像不默认整站复制。
- 历史网页可能关闭，可记录合法公开的网页存档入口；网页不在了也不删除已经核实的事实条目。

## 8. 推荐落地顺序

| 阶段 | 具体产出 | 验收重点 |
| --- | --- | --- |
| 1 | 音乐馆＋10 个 RGR 主体发行＋《カケル×カケル》合集关联＋28 首鼓子演唱基础条目 | 《点とミライ》独唱可找到；同曲不重复；其他成员 solo 不算鼓子演唱 |
| 2 | 《Run For You!》、节目 BD／广播 CD 元数据、既有活动补场次及官方来源 | 公告／发行／活动／受注／发货日期分清；无新增重复活动 |
| 3 | 本报告活动候选与节目补全 | 每条注明证据级别；延期取消不混进实际出演 |
| 4 | RGR 专题、跨资料关联、别名与相关材料搜索 | 搜 RGR／ランガ／曲名能找到不同馆藏；能定位具体条目 |
| 5 | 外链博客、YouTube、X 与外部主办方补证 | 独立核查回次、实际出演、视频可用性；不宣称官网目录等于完整履历 |

本报告与来源目录是研究产物，尚未把候选项导入正式 YAML，也未更改现有用户编辑。
