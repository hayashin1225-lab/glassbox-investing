# Glassbox ソフトウェア設計 採用候補整理

Status: Working Note / Not Canon
Original Date: 2026-08-23
Revised: 2026-08-24
Scope: 現時点までの対話、Issue #13 調査結果、既存 Working Ledger、および `canon/on-demand-evidence-reconstruction-and-narrative-context.md` を踏まえた実装候補

---

## 0. この文書の目的

本書は、Glassbox Investing の実装に入る前に、現時点で有力なソフトウェア構造・レポート構造・取得方式・更新方式をまとめ、後続の人間判断と実装検証へ渡すための作業メモである。

ここで扱うのは**実装候補**であり、正本ではない。

上位原則は以下の正本に従う。

- `canon/cognitive-plasticity-and-decision-foundation.md`
- `canon/on-demand-evidence-reconstruction-and-narrative-context.md`

2026-08-24 の重要修正は二つ。

1. **製品ランタイムで有償AI APIを使用しない。初版ではOSS LLMの内蔵も前提としない。**
2. **Glassbox は Stock Database を中心にせず、1銘柄ごとに Evidence と Narrative Context をオンデマンドで再構成する。**

したがって、旧来の

> 数値取得 → Normalization → Detector → Priority Router → Report

だけでは不十分であり、取得前段と Narrative 系統を明示した次の構造へ改める。

> 銘柄入力
> → Search Plan / Source Router
> → Evidence Retrieval + Narrative Retrieval
> → Evidence Normalization + Narrative Normalization
> → Detector群 + Fact–Narrative Gap
> → Priority Router
> → Report

---

# 1. 製品の中心定義

Glassbox の対象は銘柄そのもの。

扱う候補:

- 企業の収益構造
- 財務健全性
- キャッシュフロー
- バリュエーション
- 株価の現在位置
- 決算・業績修正・配当等の企業イベント
- 必要に応じた市場・マクロ文脈
- 公開Web上で現在注目されている論点
- その論点を支持・弱化する証拠
- Fact–Narrative Gap
- 未確認事項
- 再査読すべき条件

扱わない候補:

- 推奨銘柄一覧
- Buy / Sell / Strong Buy 等の方向付け
- 目標株価
- ポートフォリオ管理
- 保有比率管理
- 個人の取得価格・資産額・リスク許容度を前提にした助言
- 発注・仲介

基本線:

> **銘柄を管理しない。銘柄を査読する。**

さらに、データ保有の競争ではなく、

> **Stock Database ではなく Stock Reconstruction。**

を実装側でも採る。

---

# 2. 商品価値を作る三層

## 2.1 第1層：レポート項目

ユーザーが最も直接的に価値を感じる層。

方向性:

- 四季報的な基礎情報は必要十分に押さえる
- 既存製品の良い項目は真似る
- 情報量競争には行かない
- Glassbox独自項目は「査読」に集中する
- 数値だけでなく、現在その数値がどの文脈で語られているかも分離表示する

> **基礎情報 × 独自査読 × Narrative Context**

## 2.2 第2層：査読アルゴリズム

商品の中核。

> **どの証拠を、どの条件で、どう解釈可能な状態へ変換するか**

を決定論的に処理する。

理想状態:

> **同じ取得結果 + 同じ Engine version = 同じ査読結果**

Webは変動するため、完全再現性の対象は「外部世界そのもの」ではなく、**取得時点の保存済み証拠集合に対するEngine出力**とする。

## 2.3 第3層：AI引き継ぎプロンプト

Glassbox内蔵AIではない。

確認済み事実、Narrative Context、Detector結果、Fact–Narrative Gap、未確認点、出典、次に調べるべき問いを構造化し、ユーザー自身の ChatGPT / Claude / Gemini 等へコピーできる形で出力する。

---

# 3. Source Acquisition Architecture

## 3.1 On-Demand Retrieval

全銘柄を常時同期しない。

ユーザーが指定した1銘柄について、その時点で必要な証拠を探索する。

有力フロー:

1. 銘柄コード / 会社名入力
2. Identity Resolver で企業同定
3. Search Plan生成
4. Source Routerが候補ソースを選択
5. Evidence Retrieval
6. Narrative Retrieval
7. ローカル保存
8. 正規化・Detector実行

## 3.2 Search Plan

検索そのものを場当たりにしない。

候補クエリ群:

- 企業名 + 決算
- 企業名 + 業績
- 企業名 + IR
- 企業名 + 配当
- 企業名 + 下落理由
- 企業名 + 割安
- 企業名 + リスク
- 企業名 + 業界固有論点

ただし検索エンジンのHTMLスクレイピングを当然視しない。

**製品として合法・安定利用できる検索方式、公開検索API、ブラウザ経由の利用可否、各サイト利用条件を実証段階で確認する。**

## 3.3 Source Router

候補ソース:

- 企業公式IR
- 公的開示
- 公的統計
- 商用利用条件を満たす構造化データ
- 公開Web上の報道・解説
- 将来追加する許諾済みデータコネクタ

EDINET、e-Stat、J-Quants 等は**製品存在条件ではなく Source Connector 候補**とする。

---

# 4. Evidence Layer

確認可能な事実・数値・イベントを扱う。

候補:

- 売上
- 営業利益
- 純利益
- EPS
- 営業CF / FCF
- 財務状態
- PER / PBR 等
- 株価の現在位置
- 配当
- 業績修正
- 次回決算日
- 企業公式説明

各Evidenceには可能な限り以下を付与する。

- Source
- Source type
- Publication date
- Retrieved at
- Period
- Actual / Company Forecast / その他
- Currency
- Unit
- Extraction method
- Transformation / Calculation
- License / Usage condition metadata

---

# 5. Narrative Context Layer

公開Web上で、その銘柄について現在どの論点・物語・注意が目立っているかを観測する。

これは世論調査でもセンチメントの正値でもない。

> **「投資家の何％が強気か」ではなく、「公開Web上で現在どの論点が目立っているか」を扱う。**

候補観測対象:

- 業績改善 / 悪化
- 割安 / 割高
- 配当 / 株主還元
- 成長期待
- 規制
- 中国
- 関税
- 為替
- 原材料
- 不祥事
- 生産 / 供給制約
- 業種固有テーマ

AIなしの初版では、完全な自然言語理解を目指さず、

- タイトル
- スニペット
- 公開日時
- ドメイン
- ソース種別
- キーワード / 辞書
- 出現頻度
- 時系列変化

を中心に検出する。

---

# 6. Normalization Layer

## 6.1 Evidence Normalization

分析ロジック以前に、入力データの意味を揃える。

候補:

- 会計年度
- 四半期 / 通期
- IFRS / J-GAAP / US-GAAP
- 継続 / 非継続事業
- 株式分割・併合
- EPS分母
- 実績 / 会社予想 / 市場予想
- 通貨・単位
- M&A前後
- セグメント変更
- 会計方針変更
- 一過性損益
- restatement / 過年度修正
- 複数ソース間の数値不一致

> **検出器より前に、比較可能な証拠を作る。**

## 6.2 Narrative Normalization

検索結果を一件一票として扱わない。

最低限の候補:

- 同一記事・転載記事の重複除去
- 同一通信社 / 同一原稿のクラスタリング
- 同一ドメインの過剰代表抑制
- 企業公式 / 報道 / 解説 / その他の分類
- 公開日時保持
- 古い情報の時間減衰
- SEO量産記事の過大評価抑制
- 独立ソース数の識別

> **財務数値と同様に、NarrativeにもNormalizationが必要。**

---

# 7. Detector Architecture

古今の分析手法を「採点器」ではなく Detector として扱う。

候補:

- Piotroski F-score
- Altman Z-score
- Beneish M-score
- Sloan accruals
- DuPont
- ROIC
- margin trend
- FCF conversion
- leverage / interest coverage
- PER / PBR / EV/EBITDA
- historical valuation range
- peer comparison
- event calendar
- macro sensitivity
- narrative topic surge
- source convergence
- fact–narrative divergence

これらを単一スコアへ加算しない。

各Detectorは少なくとも以下を持つ。

1. `signal`
2. `applicability`
3. `failure_modes`
4. `evidence_refs`
5. `narrative_refs`（該当時）
6. `period`
7. `confidence_basis`
8. `sector_adjustment`
9. `engine_version`

> **各分析手法は採点器ではなく、特定の観点を発見する Detector として扱う。**

---

# 8. Fact–Narrative Gap

Glassbox独自査読の有力中核。

Evidence と Narrative Context を独立に保持し、両者の一致・不一致・過不足を見る。

例:

- 「大幅増益」が頻出する一方、本業の営業利益は減益
- 「割安」が頻出する一方、会社予想利益も大幅悪化
- 「成長期待」が増える一方、一次資料での裏付けが弱い
- 悪材料が多く語られる一方、企業数値にはまだ重大変化が出ていない

出力すべきものは Buy / Sell ではなく、

> **この銘柄を理解する際に、事実と現在の物語のどこを分けて見る必要があるか。**

---

# 9. Deterministic Evidence Engine

担当:

- 取得結果の保存
- 正規化
- 計算
- 期間比較
- 閾値判定
- 異常検出
- バリュエーション比較
- 価格位置
- イベント日数
- Narrative topic検出
- Fact–Narrative Gap検出
- Provenance
- Detector実行
- Priority Router
- 定型レポート生成

**初版ではここだけで商品価値を成立させる。**

---

# 10. レポート構造

## 10.1 30秒ビュー

候補:

- 銘柄名 / コード
- 最終取得時刻
- Engine version
- 「いま見るべき3点」
- 重大な反証候補
- Fact–Narrative Gap
- 未確認点
- 次の重要イベント

> **評価を集約するのではなく、論点を圧縮する。**

## 10.2 詳細ビュー

1. 企業カルテ
2. Fundamental Review
3. Valuation Review
4. Price Context
5. Event & Market Context
6. Narrative Context
7. Fact–Narrative Gap
8. Counterevidence
9. Unknowns
10. Sources / Provenance
11. AI引き継ぎプロンプト

## 10.3 企業カルテ

候補:

- 企業概要
- 主要事業 / セグメント
- 売上
- 営業利益
- 純利益
- EPS
- 営業利益率
- 営業CF
- FCF
- 自己資本
- 有利子負債
- ROE / ROIC
- PER / PBR
- 配当利回り
- 株主還元
- 株価レンジ
- 主要競合

基礎情報そのものを商品核にはしない。

---

# 11. Fundamental Review

候補:

- 売上成長と利益成長の分解
- 利益率の推移
- 本業利益と最終利益の乖離
- EPS成長の源泉
- 営業CF / FCFの質
- 利益とCFの乖離
- 運転資本変動
- 有利子負債
- 利払い余力
- 株主還元余力
- 希薄化
- 自社株買い
- 一過性要因
- 会計上の異常候補

結果は「良い / 悪い」ではなく、

> **何がそう見せているのか**

まで分解する。

---

# 12. Valuation Review

候補:

- PER
- PBR
- EV/EBITDA
- FCF yield
- 配当利回り
- 過去レンジ
- 同業比較
- 成長率との整合
- 収益性との整合

> **良い会社と、良い価格を分ける。**

一つの適正株価へ集約しない。

---

# 13. Price Context — 初版は軽量化

新正本に合わせ、Price Contextの役割を未来予測ではなく現在位置確認へ限定する。

初版候補:

- 現在値または直近終値
- 前日比
- 52週高値 / 安値
- 52週レンジ上の現在位置
- 高値からの下落率

初版の必須要件から外す候補:

- RSI
- MACD
- ボリンジャーバンド
- ローソク足パターン
- 20 / 60 / 200日移動平均判定
- 出来高パターン
- 複雑なボラティリティ指標
- 押し目買いシグナル

> **Price Context は未来予測器ではなく、現在位置確認器。**

典型的な査読テンプレート:

> **安くなったのか、悪くなったのか。**

---

# 14. Event & Market Context

## 14.1 Event / Information Change Risk

予測ではなく、

> **もうすぐ情報セットそのものが変わる**

ことを示す。

候補:

- 次回決算までの日数
- 直近決算からの日数
- 業績予想修正
- 配当・権利日
- 株主総会
- 自社株買い
- 増資
- 大型IR
- 製品発表

例:

> 次回決算まで4日。現在の査読は前回開示情報に基づく。

## 14.2 市況の扱い

必要な企業のみ、

- 金利
- 為替
- 原油
- 商品価格
- 業種指数
- 景気指標

を使う。

初版ではマクロを厚くしすぎない。

---

# 15. Sector Adapter

全銘柄を同一指標だけで見ると誤判定が増えるため、

> Common Detector Set
> + Sector Adapter
> + Company-specific Event / Narrative Context

を候補とする。

例:

### 銀行
- NIM
- 貸倒関連
- 債券評価損
- 預貸構造
- 金利感応度

### 自動車
- 台数
- 地域別販売
- FX
- 原材料
- インセンティブ
- 生産能力

### 半導体
- 稼働率
- ASP
- 在庫
- 設備投資
- 受注
- サイクル

### REIT
- NAV
- LTV
- NOI
- 稼働率
- 金利感応度

---

# 16. Priority Router

総合点を避けても、大量のDetectorから何を前面表示するかは決める必要がある。

候補評価軸:

- 異常度
- 前年 / 過去平均との差
- 同業平均との差
- 企業価値への影響範囲
- 一過性 / 継続性
- 次回イベントまでの近さ
- データ完全性
- ユーザーが通常見落としやすい論点か
- 複数Detectorが独立に同じ論点を支持しているか
- Narrative上の注目度
- Fact–Narrative Gapの大きさ
- 独立ソース数

これらを必ず一つの数値へ足し上げる必要はない。

ユーザーには「なぜこの論点が前面に出たか」を追跡可能にする。

---

# 17. Provenance と Retrieval Log

全数値・判定・説明に可能な限り以下を付与する。

- Source
- Source type
- URL
- Publication date
- Retrieved at
- Period
- Actual / Company Forecast / Consensus
- Currency
- Unit
- Calculation formula
- Normalization applied
- Detector version
- Engine version
- Source usage / license metadata

さらにWebオンデマンド方式では、**何を探し、何が取れ、何が取れなかったか**を `retrieval_log` として保持する。

これは再現性とUnknowns管理のために重要。

---

# 18. Engine versioning

データと方法論を分けて更新する。

### 取得データ
- 検索・決算・イベントに応じて更新

### Engine
- 方法論は版管理
- 過去の査読を新ルールで黙って書き換えない

候補表示:

- `Data / Retrieval as of: 2026-08-24 20:30 JST`
- `Glassbox Engine: 2026.1`
- `Rule Set: 2026`

同じ保存済み取得結果 + 同じEngineで同じ結果になることを再現性の基準とする。

---

# 19. AI利用方針

## 19.1 製品ランタイムでは有償AI APIを使用しない

> **製品ランタイムで有償AI APIを使用しない。**

ChatGPT API、Claude API、Gemini API 等をGlassbox側の継続原価として組み込まない。

## 19.2 初版ではOSS LLM内蔵も前提にしない

Narrative Contextは初版ではルール・辞書・メタデータ・重複除去等で検出する。

自然言語の完全理解を製品成立条件にしない。

## 19.3 AIを使う場所

### A. 開発・研究工程

- 分析手法調査
- IR文書構造研究
- 業種別論点抽出
- Narrative辞書生成候補
- 失敗条件探索
- ルール候補生成
- 回帰テストケース作成

### B. ユーザー自身の外部AI

GlassboxはAPI連携せず、AI引き継ぎプロンプトを生成してコピー可能にする。

> **開発にはAIを使う。製品はAIに依存しない。**

---

# 20. 内部データモデル候補

最低限、以下を分離する。

```text
company_identity
search_plan
sources
retrieval_log
evidence
narrative_items
narrative_clusters
narrative_topics
fact_narrative_gaps
detectors
events
unknowns
top_issues
report
```

概念例:

```json
{
  "symbol": "7203",
  "as_of": "2026-08-24T20:30:00+09:00",
  "engine_version": "2026.1",
  "retrieval_log": [],
  "evidence": [],
  "narrative_clusters": [],
  "fact_narrative_gaps": [],
  "detectors": [],
  "top_issues": [],
  "unknowns": []
}
```

重要なのは最終文章だけでなく、

> **なぜその文章が出たかを構造化状態として保存すること。**

---

# 21. 体験版との接続

有力候補:

> **任意の1銘柄を、製品版と同品質で1回だけフル査読**

体験で見せるもの:

- 30秒ビュー
- Fundamental Review
- Valuation Review
- Price Context
- Event Context
- Narrative Context
- Fact–Narrative Gap
- Provenance
- AI引き継ぎプロンプト

製品版との差は品質ではなく、査読可能回数に置く方向が有力。

オンデマンド体験生成方式を採る場合も、取得元の利用条件を別途満たす。

---

# 22. データライセンス / Web利用条件

「Webで見える」ことと、

- 商用利用できる
- 自動取得できる
- 保存できる
- ユーザーへ再表示できる
- 派生指標を販売できる

ことは別。

新設計では「最適な単一データベンダーを探す」より、**Source Routerが利用可能なソースを組み合わせる**方向へ重心を移す。

ただし利用条件問題は消えない。

早期確認候補:

- 検索サービス / 検索API
- 企業IR
- 財務
- 株価
- 企業イベント
- 報道記事のタイトル / スニペット / 本文
- 公的統計

各Sourceには `source_usage_policy` 等のメタデータを持たせる候補。

---

# 23. 法務・表現上の境界

前面に出さない候補:

- Buy / Sell
- Strong Buy
- 買い時
- 目標価格
- 上昇確率
- 将来リターン予想
- 個別利用者向け売買判断

前面に出す候補:

- 現在観測できる状態
- 過去とのズレ
- 同業とのズレ
- 業績・CF・財務の変化
- 公開Web上で目立つ論点
- Fact–Narrative Gap
- 反証材料
- 未確認事項
- 次回情報更新イベント
- 「何を見るべきか」

名称だけで規制回避できるわけではないため、実際の機能と事業形態について別途法務確認する。

---

# 24. 採用候補の優先度

## A. 強く採用候補

- 銘柄管理ではなく銘柄査読
- Stock Reconstruction
- On-Demand Retrieval
- Search Plan / Source Router
- Evidence Layer と Narrative Context Layer の分離
- Evidence Normalization
- Narrative Normalization
- Fact–Narrative Gap
- 単一総合点を中心にしない
- 論点圧縮型UI
- Detector Architecture
- Detectorごとの適用条件・失敗条件管理
- Provenance / Retrieval Log
- Engine versioning
- Fundamental を基底に Price / Event / Narrative Context を重ねる
- Price Contextの軽量化
- Event / Information Change Risk
- Common Engine + Sector Adapter
- Priority Router
- 製品ランタイムで有償AI APIを使わない
- Engine単独で商品価値を成立させる
- 外部AIへの構造化引き継ぎプロンプト

## B. 有力だが設計検証が必要

- Web検索 / 検索APIを製品から安定・合法利用する方式
- AIなしでNarrative Contextをどこまで有用に構造化できるか
- Narrative重複排除の精度
- Fact–Narrative Gapのルール設計
- Priority Router具体ルール
- Source Routerのフォールバック設計
- 同一数値の複数ソース不一致処理
- Sector Adapter
- 年次有償アップグレード
- 1銘柄フル無料体験
- 自然言語説明を決定論的テンプレートでどこまで生成できるか

## C. 原則避ける候補

- 単一の総合投資点
- Buy / Sell ラベル
- AIに財務数値そのものを生成させる
- AIに数式判定を丸投げする
- Glassbox側がAI API従量課金を恒常負担する設計
- 初版からOSS LLMを必須同梱する設計
- 四季報の情報量競争
- 何でも表示する巨大ダッシュボード
- 予測精度を商品価値の中心にする
- 高度テクニカルを初版中心にする
- ポートフォリオ機能への拡張
- Web検索結果を市場心理の正値として扱う

---

# 25. 現時点で最も重要な未解決課題

1. **On-Demand Retrieval Spike** — 1銘柄について何をどこまで自動取得できるか
2. **検索手段の利用条件** — 検索API / 検索サービス / 直接取得の合法・安定運用
3. **Evidence Extraction** — Web上の基礎数値をどこまで再現可能に抽出できるか
4. **Narrative Normalization** — 転載・重複・SEO偏重をどこまで抑えられるか
5. **Fact–Narrative Gap** — どの組合せが本当に有用な査読になるか
6. **Priority Router** — 何を「いま見るべき3点」として前面に出すか
7. **Source Usage Metadata** — 利用条件をどう機械的に管理するか
8. **Sector Adapter** — 最初に何業種まで対応するか
9. **AIなしの説明生成** — Detector結果をどこまで自然な文章へ変換できるか
10. **法務確認** — 査読・Web文脈・価格文脈・イベント表示の境界
11. **4,980円の価格納得感** — レポート内容と実利用で検証

---

# 26. 実装の推奨順序候補

### Phase 0：On-Demand Retrieval Spike

最初に1銘柄で取得の現実性を確認する。

- Identity Resolver
- Search Plan
- Source Router
- HTML / 公開情報取得
- URL / Source Type / Retrieved at 保存
- ローカルキャッシュ
- 利用条件確認

ここが成立しない場合、後段の精密設計を先に作り込まない。

### Phase 1：Evidence Extraction / Normalization

- 企業カルテ基礎数値
- 財務期間
- 単位
- 実績 / 予想
- 複数ソース不一致
- Provenance

### Phase 2：Narrative Retrieval / Normalization

- タイトル / スニペット
- Source Type
- 日付
- 重複排除
- 同一原稿クラスタリング
- Topic辞書
- 時間減衰

### Phase 3：最初のDetector群

まず少数の高説明力Detectorから始める。

候補:

- margin trend
- earnings vs cash flow
- debt / interest burden
- shareholder return sustainability
- basic valuation position
- next event proximity
- narrative topic surge
- source convergence

### Phase 4：Fact–Narrative Gap

- 増益物語 vs 本業利益
- 割安物語 vs 利益悪化
- 成長期待 vs 一次証拠
- 悪材料集中 vs 実績変化

### Phase 5：Priority Router

多数の検出結果から「いま見るべき3点」を選ぶ。

### Phase 6：決定論的レポート生成 + 詳細UI

30秒ビュー → 根拠 → 元ソースへ掘れる構造。

### Phase 7：AI引き継ぎプロンプト

Engine結果を構造化し、ユーザー自身の外部AIへ渡せる形を作る。

**Glassbox側からAI APIを呼ばない。**

### Phase 8：Sector Adapter

高頻度・高需要業種から追加。

### Phase 9：Engine 2026 固定

- ruleset
- data schema
- retrieval schema
- detector versions
- normalization version

を固定し、再現可能な初版とする。

---

# 27. まとめ

現時点で最も筋が通っている Glassbox の姿は、単なる財務情報サイトでも、AIによる銘柄診断でも、予想ソフトでもない。

> **ユーザーが今見たい1銘柄について、公開されている証拠と、その周囲で現在語られている物語をオンデマンドで独立収集し、その一致・不一致・見落としを再現可能なDetector群で査読し、重要論点へ圧縮して提示するローカル志向のソフトウェア。**

内部では、

> **Search Plan / Source Router → Evidence + Narrative → Dual Normalization → Detector群 → Fact–Narrative Gap → Priority Router → Report**

を中核候補とする。

大規模な金融DBやAI推論基盤をGlassbox社側に持つことを初版成立の前提にはしない。

ただし、Web検索・公開情報利用は無制約ではないため、**取得技術と同時に利用条件を実装要件として扱う。**
