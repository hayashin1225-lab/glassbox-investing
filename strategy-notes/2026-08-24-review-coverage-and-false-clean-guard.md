# Glassbox 査読Coverage / False-Clean Guard 採用候補

Status: Working Note / Not Canon
Date: 2026-08-24
Source: intelligence-externalization の candidate-thread omission 再発防止を横断検索し、Glassbox の Detector / Evidence Engine に同型の負の結果誤認リスクを確認したため。

## 1. 問題

Glassbox は Detector Architecture、Evidence Engine、Counterevidence、Unknowns を持つ設計候補だが、次の二つは同じ見た目になり得る。

1. 必要な観点を評価した結果、重大な反証が検出されなかった。
2. そもそも必要な観点・データ・Detector が評価されていない。

この差を消すと、`no signal`、`no counterevidence`、`問題なし` が false clean になる。

> **検出されなかったことと、評価されなかったことを同一視しない。**

これは投資判断の方向を出すための新しい分析手法ではなく、既存の再現可能な査読構造を壊さないための coverage guard 候補である。

## 2. Detector の負の状態を分離する

Detector は少なくとも次を区別できるようにする候補とする。

- `triggered` — 適用可能で、signal を検出した
- `clear_within_scope` — 適用可能・必要データあり・実行成功し、定義された signal は検出しなかった
- `not_applicable` — 当該企業・業種・期間には適用しない
- `insufficient_data` — 必要データ不足で評価不能
- `source_unavailable` — 一次資料またはデータ供給元へ到達できない
- `failed` — 計算・正規化・実行エラー
- `not_evaluated` — 今回の査読範囲に入っていない

`clear_within_scope` 以外を「異常なし」と表示しない。

## 3. Report Coverage Status

銘柄レポート全体にも、結論とは別に coverage 状態を持たせる候補とする。

```json
{
  "review_scope": {
    "planned_detectors": 12,
    "evaluated_detectors": 10,
    "not_applicable": 1,
    "insufficient_or_failed": 1,
    "coverage_status": "partial",
    "unavailable_sources": ["..."],
    "data_as_of": "..."
  }
}
```

`coverage_status` は投資品質スコアではない。査読がどこまで成立したかを示す observability である。

候補状態:

- `evaluated` — 今回予定した適用可能範囲を評価できた
- `partial` — 一部の適用可能範囲が未評価・データ不足・失敗
- `blocked` — 中核データ不足等で査読結果を安全に生成できない

「世界中の重要情報を完全網羅した」という意味の `complete` は使用しない。

## 4. False-Clean Guard

次の表示は、coverage 条件を満たした場合だけ許容する。

- 重大な反証は検出されませんでした
- 財務上の重大異常は検出されませんでした
- 現時点で大きな懸念は確認されませんでした

条件:

1. 対応する主要 Detector 群が `clear_within_scope` または `not_applicable` である。
2. 主要一次データが必要期間について取得できている。
3. `insufficient_data / source_unavailable / failed / not_evaluated` が結論へ影響し得る場合、その旨を前面表示する。
4. 表現は必要に応じて「**評価できた範囲では**重大な反証を検出していない」とする。

coverage が partial の場合、無事故表示ではなく不足を Unknowns / Coverage へ上げる。

## 5. Activity / Freshness Sentinel

前回査読後に以下の活動痕跡がある場合、旧査読をそのまま current とみなさない候補とする。

- 新決算・決算短信・有価証券報告書
- 業績予想修正
- 増資・M&A・大型売却・重要契約
- 配当・自社株買い等の重要資本政策
- 企業価値に影響し得る主要IR
- Detector が依存する市場・業種・外部データの更新

活動痕跡は「悪材料がある」証拠ではない。**再査読が必要かもしれない sentinel** として使う。

`last_review_at` と `latest_relevant_source_at` を比較し、後者が新しい場合は `stale / refresh-required` を候補状態にする。

## 6. Priority Router との境界

Coverage Guard は「いま見るべき3点」を選ぶ Priority Router と別責務にする。

Priority Router は評価済み結果から前面論点を選ぶ。
Coverage Guard は、そもそも評価対象・データ・Detector が欠けていないかを見る。

したがって、重要論点3点が綺麗に出ていても coverage が partial なら、その不足は隠さない。

## 7. AI Narrative Layer への拘束候補

AI Narrative Layer は、未評価・不足・失敗を自然な文章で埋めてはならない。

- Evidence がない箇所を一般知識で補って「問題なし」としない
- `not_evaluated` を `clear` へ言い換えない
- 取得不能な一次資料の内容を推測しない
- coverage partial を結論文章の滑らかさで隠さない

AIの役割は不足を消すことではなく、不足が判断上どう効くかを説明することに置く。

## 8. 実装順序候補

最初から大規模な網羅性管理を作らない。

Phase 1 の少数 Detector 実装時に、各 Detector へ `execution_status` を一つ追加する。

その後、実際に false clean が起きる、または複数 Detector を束ねる時点で、Report Coverage Status と freshness sentinel を追加する。

既存の実証優先原則に従い、coverage の点数化や精巧な completeness score は現時点では作らない。

## 9. 元になった失敗との関係

intelligence-externalization では、Glassbox 会話が候補集合へ載らなかったにもかかわらず、日次収穫が `0件` と出た。問題は「評価して0だった」のではなく、「評価対象に入っていなかった」ことだった。

Glassbox でも同型に、

> Detector が反応しなかった

と

> Detector が走っていなかった

を分ける必要がある。

ただしこれは構造転用であり、知的収穫の coverage 規則をそのまま投資分析へコピーするものではない。実装と実利用で有効性を確認するまで Working Note とする。
