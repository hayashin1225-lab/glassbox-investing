# Investment Cognition Pre-Implementation Research

Status: Final research report  
Date: 2026-08-16  
Issue: #7  
Decision target: #6 Investment Cognition MVP Phase 0

## 0. Executive decision

**#6は実装開始可。**

市場調査は、現行の中核仮説を否定しなかった。

> 原問いを保持したまま、問い・調査・判断を可逆的に構造化する。

既存市場が強いのは、データ取得、スクリーニング、標準化された企業分析、可視化、ポートフォリオ追跡、約定後の統計、保有後のthesis監視である。一方、ユーザー自身の生の問いを保存し、その問いを上書きせずに調査・判断へ接続し、No Tradeを含む判断を後日検証可能にする前工程は、依然として断片的である。

ただし、#6には次の5点を調査反映する。

1. 原問いは一行から開始できる。目的・期間・制約等は任意かつ段階表示にする。
2. 調査メモに、最低限の「事実 / 解釈 / 問い」と任意の出典URL・日付を持たせる。
3. 制御された選択肢には「該当なし / 自由記述 / 後で決める」の逃げ道を置く。
4. 判断時に未確認・不明項目を表示するが、判断をブロックしない。
5. 原問いと判断は上書き消失させず、最低限の改訂履歴または判断時スナップショットを残す。

AI、外部財務データ、証券口座連携、自動スコア、ソーシャル共有はPhase 0へ持ち込まない。

## 1. 方法と証拠区分

調査対象日は2026-08-16。16の製品・サービスを、データ端末、可視化型分析、投資記録、取引日記、thesis tracking、verification、AI-native、汎用AIにまたがって比較した。

証拠を次のように区別する。

- **O — Official:** 公式機能・価格・ヘルプ。機能の存在確認には強いが、効果の自己評価は割り引く。
- **R — Research:** 査読論文・研究資料。行動傾向には強いが、対象時期・母集団を明記する。
- **U — User evidence:** 掲示板・レビュー。摩擦と原問いの発見に使うが、代表性・真偽を保証しない。
- **I — Inference:** 複数証拠からの本調査上の推論。外部事実として扱わない。

価格は公開表示のスナップショットであり、税・地域・キャンペーン・年払い条件で変動する。

## 2. Product Landscape Map

| 類型 | 製品 | 入口・主価値 | 強い場所 | 主な弱点・Glassboxとの差 | 価格・事業モデル |
|---|---|---|---|---|---|
| データ端末 | Koyfin | 市場ダッシュボード、銘柄、スクリーナー | 100K+銘柄、5,900+条件、チャート、カスタム画面 | 自分の原問い・判断過程ではなく、データと画面構成が主語。学習曲線への不満あり | Free、Plus $39/月、Premium $79/月等のsubscription |
| データ端末 | TIKR | 銘柄検索、財務、推計、transcript、screen | グローバル財務の標準化、長期履歴、比較 | データをthesisへ結びつける作業はユーザー側。鮮度・誤差・API不足の利用者報告あり | Free、Plus $24.95、Pro $54.95、Ultimate $119.95/月 |
| データ・portfolio | Stock Rover | watchlist / portfolio / screener | 豊富な指標、比較、portfolio分析、broker連携 | 機能密度が高く初心者には重い。Notesは歴史的調査で少数利用 | $29〜$149/月級のsubscription |
| AI-native data | Fiscal.ai | 銘柄、terminal、Copilot | source-linked財務、KPI、IR資料、screen、AI要約 | AI promptと継続データがsubscription前提。問い・判断の永続状態は中心でない | Free、Plus $24、Pro $64/月 |
| ガイド・可視化 | Simply Wall St | 銘柄またはportfolio、Snowflake | 視覚的スキャン、標準化レポート、portfolio把握 | score・DCF・自動生成説明を判断そのものと誤認しやすい。精度・一般論への不満 | freemium + subscription |
| ガイド・rating | WallStreetZen | 銘柄、Zen Rating、DD checks | 一行説明、初心者向け解釈、screening | 評価・推薦が前面に出てユーザー自身の問いが後退。backtest表示への過信リスク | Free、Premium $19.50/月相当（年払い） |
| 投資decision journal | InvestJournal | idea → thesis → outcome → reflection | 購入前理由と結果を接続し、hindsight biasを扱う | 明示的thesis記述が前提。入力継続率と現在の利用規模は未検証 | Free start、詳細価格非公開 |
| 投資decision journal | Journalytic | thesis、decision、prediction、checklist、analytics | 投資判断の閉ループに近く、self-contractや機会損失も扱う | 多機能化による負荷、privacy解釈、2026年の新規登録不具合報告 | retail向けfree betaとの公開情報 |
| trading journal | TraderSync | broker import / trade plan / trade log | 約定取込、notes、tags、replay、統計 | 取引後・短期取引中心。高度分析は上位plan、sync摩擦の報告 | Pro $22.46/月相当（年払い）以上 |
| trading journal | Edgewonk | journal作成、import、checklist | psychology、mistake、strategy、reviewの構造化 | 詳細入力の負担が大きい。高頻度利用には不向きとの声 | 継続課金、公開時点で$197/16か月offer |
| trading journal | TradesViz | import、dashboard、600+ stats、AI Q&A | 幅広い資産、free層、詳細統計、自動取込 | 機能過多・学習負荷、cost-basisやsync精度への利用者不満 | Free + Pro約$14.99/月 |
| thesis verification | ThesisCheck | ticker + 最大2,000字のwritten thesis | claim単位、dated source、forced bear case、evidence gap | thesisが書けた後の一回性検証。原問い形成、継続状態、portfolioは対象外 | CHF39/回、3回CHF99、5回/月CHF149 |
| thesis monitoring | Helm Terminal | holding / brokerage + thesis pillars | filing・newsをpillarへ照合、引用付きalert、portfolio横断 | 保有後・holding-first。カテゴリ整理はvendor自身のため効果評価は要検証 | Free start、Pro $20/月 |
| 汎用AI | ChatGPT | 自由入力、search / deep research | 任意の原問い、反復質問、複数sourceの統合、引用付き調査 | 投資案件のdomain stateを自動では保持しない。流暢な回答を判断と混同し得る | Free + paid subscription |
| 汎用AI | Claude | 自由入力、web search / Research | 長文、複数source、引用、connected context | 同上。入力・出力は会話中心で、decision ledgerではない | Free、Pro $20/月、Max $100〜 |
| 汎用AI | Perplexity | 自由質問、source-linked answer / Research | 現行webの探索とinline citation、短時間の調査 | 問いごとのanswer engineで、投資案件の可逆状態・判断履歴は別管理 | Free + Pro / Max（Max $200/月） |

### 2.1 既存製品が強い場所

1. **構造化データの収集と標準化**
   - Koyfin、TIKR、Stock Rover、Fiscal.aiは、Glassboxが再実装すべきでない成熟領域を形成している。
2. **銘柄単位の高速な概観**
   - Simply Wall StのSnowflake、WallStreetZenの一行DD、各terminalのsnapshotは、短時間で入口を作る。
3. **約定・portfolioの自動取込**
   - trading journalsは、反復入力を自動化しなければ継続しにくいことを市場学習している。
4. **証拠へのリンク**
   - Fiscal.ai、ThesisCheck、Helm、汎用AIのResearch機能は、回答だけでなくsourceへ戻れることを価値にしている。
5. **保有後の監視**
   - alerts、portfolio notifications、thesis monitoringはsubscriptionを支える継続価値になっている。

### 2.2 まだ弱い場所

1. **銘柄・保有・scoreより前にある生の原問い**
2. **原問いと構造化された問いの併存**
3. **問い・調査・判断を同一案件内で可逆に往復すること**
4. **未確認・不明・関係なしを欠陥ではなく正式状態にすること**
5. **No Tradeを価値ある終了状態として保存すること**
6. **事実、解釈、未確認事項、判断理由を一つの小さなledgerへ接続すること**
7. **長期投資家向けに、低入力負荷で判断前後をつなぐこと**

これは「競合が存在しない」という意味ではない。InvestJournal、Journalytic、ThesisCheck、Helmは隣接する重要な反例である。ただし、いずれもGlassboxの全閉ループと同一ではなく、特に入口がthesis、holding、ticker、tradeのいずれかに寄っている。

## 3. User Question Map

頻度は統計的市場シェアではない。**High**は大規模行動データまたは複数独立sourceで反復、**Medium**は複数コミュニティで反復、**Emerging**は製品カテゴリと少数の利用痕跡が中心、という証拠強度である。

| 原問いの類型 | 証拠強度 | 原問いの粒度を保った例 | 文脈 |
|---|---|---|---|
| 何を買うか | High | 「最初にどれを買えばよいか」「このテーマで何が残っているか」 | GenAI利用では統合されたinvestment signalを直接求める傾向が強い |
| 高値掴み・割高 | High | 「もう上がりすぎか」「良い会社でも今買うべきか」 | price chart、snapshot、valuationへの強い注意と整合 |
| なぜ動いた・何が変わった | High | 「今日なぜ下がったか」「決算の何が重要か」 | GenAIの主要用途はmarket/company情報のinterpretationとcontextualization |
| 何から調べるか | High | 「銘柄調査はどこから始めるか」「何を見ればよいか」 | dashboardや指標があっても次行動が分からないという反復的摩擦 |
| 開示資料の読み方 | Medium-High | 「10-Kのどこを読むか」「決算書の良し悪しをどう見るか」 | 一次資料へ行く意欲はあるが、解釈負荷が高い |
| AとBの比較 | Medium | 「AとBならどちらか」「同業他社と比べて何が違うか」 | terminalのcomparison、AI chatの代表的用途 |
| 自分のthesisは妥当か | Medium / Emerging | 「この理由で持つのは妥当か」「何が起きたら間違いか」 | ThesisCheck、Helm、InvestJournal等の新カテゴリが対応 |
| 情報を追い続ける方法 | Medium | 「filingやnewsをどう見逃さないか」 | watchlist、alerts、thesis monitoringが対応 |
| 自分の判断から学ぶ | Emerging | 「当時の判断は良かったか」「結果ではなくprocessをどう振り返るか」 | journal製品の価値だが、notes利用と継続に摩擦 |

### 3.1 行動研究からの重要な制約

- 2026年のJournal of Accounting and Economics論文は、2024年調査で47%のretail investorsがfinancial information processingにGenAIを利用したと報告した。主用途は情報・市場変動の解釈と文脈化で、品質とprivacyが阻害要因だった。
- 同研究は400,000件超のbrokerage chatbot queryを分析し、反復利用者ではscreeningからcompany-specific newsのmonitoring / interpretationへ用途が移ると報告した。
- 2026年Journal of Accounting Research論文の公開要約は、ユーザーが中間材料より統合されたinvestment signalを直接求めがちで、news/event monitoringが17.7%と報告する。
- 個人投資家のbrowser行動研究では、中央値で売買対象tickerの調査は約6分、研究の多くは取引直前に集中し、多くがsnapshotを越えず、越えてもprice chartへの注意が強い。データは2007年で古いため現代UXへの直接一般化はしないが、**初回入力を長くしすぎない拘束**として使える。

## 4. UX Pattern Ledger

### 4.1 継承候補

| パターン | 判定 | #6への意味 |
|---|---|---|
| 一行の自由入力から開始 | Adopt | 原問いは短くてよい。完成したthesisを要求しない |
| progressive disclosure | Adopt | 目的・期間・制約・既確認事項は任意で後から追加 |
| originalとstructuredを分離 | Adopt | 原問いを上書きしない |
| source receipt | Adopt-minimal | 任意URL・source date・閲覧日を持てる |
| 事実と解釈の分離 | Adopt-minimal | note kindを最低限持つ |
| formal Watch / No Trade | Adopt | 売買を強制しない |
| reversible navigation | Adopt | tabsまたは同等手段で自由往復 |
| autosave / local persistence | Adopt | 記録摩擦と喪失を減らす |
| unresolved itemsの可視化 | Adopt | decision時に表示するがgateにしない |
| decision snapshot / revision | Adopt-minimal | hindsightによる書換えを防ぐ |
| skip / none-fit / free text | Adopt | 決定木地獄を避ける |

### 4.2 避けるべきパターン

| パターン | 理由 |
|---|---|
| 最初に長いthesis templateを必須化 | journal離脱とblank-page frictionを増やす |
| 一方向wizardと必須completion gate | 原問い原則と三状態可逆性に反する |
| 主要画面をmetric dashboardにする | 「次に何をすべきか」をさらに不明にする |
| 一つのscore / AI verdictを中心にする | 根拠と不確実性を圧縮し、最終判断代行へ近づく |
| AIにthesisを自動生成させ、そのままuser beliefと扱う | ユーザー自身の考えと生成文を混同する |
| 既確認事項の再入力 | 反復摩擦を増やす |
| 手動入力の量を価値の代理にする | 記録が目的化し、継続率を落とす |
| subscription meterを認知ループ内に置く | 判断の集中を課金都合で分断する |
| broker syncを入口に必須化 | privacy、認証、integration failureをPhase 0へ持ち込む |

### 4.3 未判定

- checklist/templateが初心者ガイドになるか、固定分類の押し付けになるか
- reminderが振り返りを促すか、通知疲れになるか
- immutable historyの粒度
- AIによる反証候補提示の有用性と過信
- public sharing / credibility機能
- gamification / score
- ticker-first利用者に原問い入力が負担になるか

これらはPhase 0以後の実利用で判定する。

## 5. Price and Business Model Findings

### 5.1 市場の現状

- データ端末、live monitoring、broker sync、AI promptはほぼsubscriptionである。
- trading journalも継続課金が主流で、free層はimport件数・analytics・retentionを制限する。
- ThesisCheckは一回・pack・subscriptionを併設し、episodic verificationの従量価値を示す。
- 買い切りに近い期待はユーザー側に存在するが、データライセンス、AI、live sync、supportが継続費を生む。

### 5.2 Glassboxへの含意

買い切り型を維持するには、Phase 0コアを次に限定する必要がある。

- local-first
- 外部dataなし
- AIなし
- broker syncなし
- deterministic state management
- user-owned exportを将来追加可能なdata model

将来、継続費が避けられない機能はコア購入と分離する。

- BYOK / user-selected AI
- optional live-data add-on
- optional monitoring subscription
- 一回性verification credit

**買い切り原則は否定されなかったが、継続データ・AIまで同一価格へ内包する設計とは緊張する。**

## 6. MVP Impact Matrix

### 6.1 #6へ採用

| 項目 | 外部根拠 | 実装レベル |
|---|---|---|
| 原問い自由入力・別オブジェクト保持 | User questionsは高度なthesis語彙から始まらない | Required |
| 三状態可逆 | 既存製品はworkflowを分断しがち | Required |
| context fieldsを任意化 | 典型的調査時間とjournal friction | Required |
| 4状態 confirmed / unconfirmed / unknown / irrelevant | evidence gapを明示するverification製品の価値 | Required |
| note kind: fact / interpretation / question | scoreやAI説明の混同を避ける | Required-minimal |
| optional source URL / source date | cited research、filing receiptへの市場学習 | Required-minimal |
| Buy / Watch / No Trade / return | 行動強制を避け、見送りを学習対象にする | Required |
| 未確認項目をdecision画面へ表示 | confidenceの過剰圧縮を避ける | Required |
| revision / decision snapshot | hindsight bias防止がjournalの中核価値 | Required-minimal |
| local persistence | 記録摩擦を下げ、買い切りコアを守る | Required |

### 6.2 後回し

- external filings / price / financial API
- AI summarization、AI adversarial review
- brokerage sync
- automated thesis monitoring
- reminder / alert
- portfolio analytics
- post-outcome calibration UI
- templates library
- JSON/CSV export（data modelでは妨げない）
- multi-user / cloud sync

### 6.3 棄却（Phase 0および中核原則上）

- automatic buy/sell rating
- scoreを最終結論として表示
- one-way wizard
- mandatory broker connection
- AI-generated thesisをuser beliefとして保存
- required public sharing
- 全項目入力完了までdecisionを禁止
- 原問いの上書き

### 6.4 要検証

1. 問い-firstとticker-firstの両入口で、一行原問いが負担にならないか
2. note kindが役立つか、分類負担になるか
3. optional source入力が使われるか
4. 3状態の往復が自由さになるか、迷子を生むか
5. No Tradeが実際に選ばれ、後日意味のある記録になるか
6. revision historyが安心につながるか、複雑さになるか

## 7. Contradiction Log

| 現行原則 | 外部知見 | 判定 | 対応 |
|---|---|---|---|
| 原問いを捨てない | 多くの市場UXはticker / portfolio / score起点。実ユーザーは短く曖昧な問いを持つ | **反証なし、支持寄り** | 一行から開始。高度語彙へ翻訳しない |
| 三状態可逆 | 市場はdata、journal、verificationを別製品へ分断。直接の成功証拠は薄い | **重大反証なし、未実証** | Phase 0の中心仮説として実利用 |
| No Tradeを正常状態 | 主流製品はpicks、ratings、trade analyticsを収益化 | **反証なし、商業的逆風あり** | 選択頻度と価値を実測 |
| AIをコア必須にしない | 47%利用の調査とAI-native製品成長 | **軽い緊張、反証なし** | 外部AI併用を前提にしつつコアはdeterministic |
| Investment Caseを主語にする | 主流はticker / holding / trade主語。decision journalはcaseに近い | **代替構造あり、未決** | 同一ticker複数caseを実案件で検証 |
| 買い切り・低固定費 | live data、monitoring、AI、syncはsubscription中心 | **明確な制約** | Phase 0をlocal-only。将来の継続費はoptional分離 |
| 原問いを分類で上書きしない | guided scoreは初心者に速い価値を出す | **trade-off** | quick guidanceは許すがoriginalを別保存 |

### 7.1 正本・準正本の判定

- Canon 4文書を変更する根拠：**なし**
- Provisional Canon `investment-cognition-closed-loop.md`を修正・棄却する重大反証：**なし**
- 正本昇格の根拠：**まだなし**。Phase 0実利用が必要。
- 三状態可逆構造：**実装検証へ進める価値あり**
- 原問い原則：**維持**
- AI非必須：**維持。ただし外部AI併用をテスト文脈に含める**

## 8. #6 implementation gate

**判定：GO with bounded amendments**

#6の現行非目標を維持し、実装前に以下だけ明文化する。

- optional source metadata
- fact / interpretation / questionの軽量区分
- original questionとdecisionの最低限のrevision/snapshot
- progressive optional fields
- unresolved itemsのnon-blocking表示
- none-fit / free-text escape

Phase 0の成功判定は、機能数ではなく、一件の実在案件で次を観察できることである。

1. 原問いが失われない
2. 調査によって問いへ戻る必要が実際に生じる
3. 判断時に未確認事項が見える
4. Buy以外を自然に選べる
5. 後から当時の状態を再現できる
6. 入力負荷が価値を上回らない

## 9. Sources

### Official product sources

- [Koyfin features](https://www.koyfin.com/features/)
- [Koyfin screener](https://www.koyfin.com/features/stock-screener/)
- [Koyfin pricing](https://www.koyfin.com/pricing/)
- [TIKR pricing and plan comparison](https://www.tikr.com/pricing)
- [Stock Rover plans](https://www.stockrover.com/plans/)
- [Stock Rover historical user survey](https://www.stockrover.com/blog/user-survey-results/)
- [Fiscal.ai platform](https://fiscal.ai/)
- [Fiscal.ai pricing](https://fiscal.ai/pricing/)
- [Simply Wall St Snowflake methodology](https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work)
- [Simply Wall St portfolio analysis](https://support.simplywall.st/hc/en-us/articles/9423775242383-Understanding-the-Portfolio-Returns-Analysis-Calculations)
- [WallStreetZen plans](https://www.wallstreetzen.com/plans)
- [InvestJournal](https://www.investjournal.co/)
- [TraderSync pricing](https://tradersync.com/pricing/)
- [Edgewonk pricing](https://edgewonk.com/pricing)
- [TradesViz pricing](https://www.tradesviz.com/pricing/)
- [ThesisCheck methodology comparison](https://thesischeck.io/ai-stock-research-tools-compared)
- [ThesisCheck pricing](https://thesischeck.io/pricing)
- [Helm thesis-tracking landscape — vendor-authored](https://helmterminal.dev/blog/thesis-tracking-apps)
- [ChatGPT deep research](https://help.openai.com/en/articles/10500283-deep-research)
- [Claude Research](https://www.anthropic.com/news/integrations)
- [Perplexity Research](https://www.perplexity.ai/help-center/en/articles/10738684-what-is-research-mode)

### Independent research

- [Generative AI and Investor Processing of Financial Information, JAE 2026](https://www.sciencedirect.com/science/article/pii/S0165410126000510)
- [How Stock Market Participants Use Generative AI, JAR 2026](https://doi.org/10.1111/1475-679x.70051)
- [The Research Behavior of Individual Investors](https://afajof.org/management/viewp.php?n=181300)

### User and review evidence

- [Koyfin review themes, G2](https://www.g2.com/products/koyfin/reviews?qs=pros-and-cons)
- [TIKR 18-month user review with limitations](https://pickuma.com/for-investor/tikr-terminal-review/)
- [Simply Wall St user discussion](https://www.reddit.com/r/PersonalFinanceCanada/comments/1gy7w9l)
- [Simply Wall St accuracy discussion](https://www.reddit.com/r/ASX_Bets/comments/1jhy2q8/is_simply_wallstreet_accurate/)
- [Trading journal feature overload and manual-entry discussion](https://www.reddit.com/r/Daytrading/comments/nq2omd)
- [Trading journal comparative friction](https://www.reddit.com/r/Daytrading/comments/tofvx2)
- [TradesViz sync and calculation discussion](https://www.reddit.com/r/RealDayTrading/comments/1gw2nf5/trading_journals_tradesviz/)
- [Journalytic user workflow and privacy discussion](https://forum.valuepickr.com/t/journalytic-an-awesome-tool-to-improve-investment-journey-and-get-over-behavioral-biases/181235)
- [How to choose an investment](https://www.reddit.com/r/ValueInvesting/comments/1f2v60u)
- [How to read annual reports](https://www.reddit.com/r/ValueInvesting/comments/18z7y0b)
- [Where stock research begins](https://www.reddit.com/r/ValueInvesting/comments/j16z4i)
- [Research-tool clutter discussion](https://www.reddit.com/r/StocksAndTrading/comments/1tx7epo/what_stock_research_tools_are_people_using_before/)
- [Conflicting opinions and trust problem](https://www.reddit.com/r/investingforbeginners/comments/1ufviz3/how_do_you_guys_actually_research_a_stock_before/)
