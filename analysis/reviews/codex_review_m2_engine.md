<p>コード上で確認できた指摘を，重要度順にまとめます．TypeScript の型検査は成功していますが，実行時・状態管理上の問題が残っています．</p>

<ul>
  <li><strong>重大：</strong><code>src/data/scenario.ts:3–9</code>，<code>src/main.ts:20,36</code> — 章として読み込まれるのは実在する <code>S01.ts</code>，<code>S02.ts</code>，<code>S07.ts</code> の3区分だけですが，原文100%の分母は <code>counts.json</code> の全13区分です．索引から開ける全文もこの3区分だけなので，通常操作では最大約14.7%までしか到達できず，原文100%バッジを取得できません．<br>修正案：全13章を <code>chapters</code> に登録するか，実装済み区分だけを分母とする暫定判定へ変更します．</li>

  <li><strong>高：</strong><code>src/main.ts:109,125</code> — <code>runEvent()</code> が次場面の <code>goto(cur + 1)</code> を <code>await</code> せず終了するため，本文チャンクの読込中に <code>busy</code> が解除されます．その間に再入力されると，旧場面のイベントが重複実行され，複数オーバーレイや重複遷移が発生し得ます．<br>修正案：<code>await goto(cur + 1)</code> とし，遷移完了まで <code>busy</code> を維持します．</li>

  <li><strong>高：</strong><code>src/main.ts:94,144–152</code> — 要旨・注釈タブを表示中でも，Space／矢印キーが非表示の <code>reader</code> を進めます．最終頁ならそのまま場面イベントへ進むため，要旨や注釈を読んでいる利用者が意図せず場面を終了できます．<br>修正案：本文タブ以外では頁送りキーを無効化するか，各タブ用のスクロール操作へ分岐します．</li>

  <li><strong>高：</strong><code>src/engine/save.ts:3–10</code>，<code>src/main.ts:42,48,86</code> — 保存される再開位置は場面IDだけで，頁番号や表示タブを保持しません．<code>Reader.set()</code> は常に頁を0へ戻すため，「つづきから」を選んでも場面の先頭から再開されます．<br>修正案：<code>Progress</code> に場面別頁番号とタブを保存し，レイアウト後に復元します．</li>

  <li><strong>高：</strong><code>src/engine/save.ts:13–16</code> — <code>JSON.parse()</code> の結果を型・配列・値域の検証なしで展開しています．有効なJSONでも <code>reached: null</code> や不正な <code>read</code> が保存されていると，<code>includes()</code> や <code>Object.entries()</code> で起動時例外になります．<br>修正案：バージョン付きの実行時バリデーションと，不正フィールド単位の既定値補完を追加します．</li>

  <li><strong>中：</strong><code>src/main.ts:29–31</code>，<code>src/engine/save.ts:15</code> — 閲覧率は保存された行番号の妥当性や重複を確認せず，単純に <code>lines.length</code> を加算します．不正・旧形式の保存値に重複や区分外の番号があると，実際に読んでいない行まで既読として計上されます．<br>修正案：ロード時に整数化・重複排除し，各区分の非空行集合との積集合だけを保持します．</li>

  <li><strong>中：</strong><code>src/engine/save.ts:14,16</code> — <code>localStorage.setItem()</code> の失敗を空の <code>catch</code> で破棄しています．メモリ上では進捗が更新されてゲームが進む一方，容量超過や保存禁止環境では再読込後に進捗が巻き戻ります．<br>修正案：保存成否を返し，失敗時は利用者へ永続化できていないことを通知します．</li>

  <li><strong>中：</strong><code>src/engine/reader.ts:7–10</code>，<code>src/main.ts:41,78,135–137</code> — 各 <code>Reader</code> が生成した <code>ResizeObserver</code> を保持・切断していません．場面変更や全文表示を繰り返すたび，破棄済みDOMを監視する Observer が残ります．<br>修正案：Observerをフィールドに保持した <code>destroy()</code> を実装し，場面変更・全文モード終了時に <code>disconnect()</code> します．</li>

  <li><strong>中：</strong><code>src/main.ts:144–152</code> — キー処理が <code>event.target</code> を判定しません．場面内の「全文」「設定」などへTab移動してSpaceを押すと，ボタンの実行ではなく <code>preventDefault()</code> 付きの頁送りになります．<br>修正案：<code>button</code>，<code>input</code>，リンクなどの操作要素にフォーカスがある場合はグローバル頁送りを行いません．</li>

  <li><strong>中：</strong><code>src/engine/ui.ts:9–13,58–60,89–94</code> — オーバーレイに <code>role="dialog"</code>，<code>aria-modal</code>，見出しとの関連付け，初期フォーカス，フォーカストラップ，終了後のフォーカス復帰がありません．キーボード利用者やスクリーンリーダーが背景画面へ迷い込めます．<br>修正案：共通 <code>overlay()</code> にダイアログ属性とフォーカス管理を集約します．</li>

  <li><strong>中：</strong><code>src/engine/ui.ts:103–117</code> — 理解課題の選択状態は <code>sel</code> クラス，正誤はクラスと通常テキストだけで表され，<code>aria-pressed</code>／ラジオグループ相当の意味付けや <code>aria-live</code> がありません．支援技術では選択変更・判定結果を把握しにくい状態です．<br>修正案：各設問を <code>fieldset</code>＋ラジオボタンにし，結果領域を <code>aria-live="polite"</code> にします．</li>

  <li><strong>低：</strong><code>src/main.ts:147–148</code>，<code>src/engine/ui.ts:19,59,91</code> — Escapeで閉じられるのは全文モードだけです．設定・図鑑・索引には閉じるボタンがあるものの，標準的なEscape操作が機能しません．<br>修正案：閉じることを許可するオーバーレイには，共通のEscapeハンドラを登録します．</li>

  <li><strong>低：</strong><code>src/main.ts:123–124</code> — 終幕後，タイトル表示から600ms後に無条件で索引を開くタイマーが残ります．その600ms以内に「はじめから」などを選ぶと，新しい場面の上へ索引が突然表示されます．<br>修正案：タイマーを管理して次の操作時に解除するか，タイトル画面のままであることを確認してから索引を開きます．</li>

  <li><strong>低：</strong><code>src/main.ts:128–130</code>，<code>src/engine/ui.ts:96–97</code> — 索引は自身を閉じてから非同期の <code>fullText()</code> を呼びます．本文チャンクの読込が終わるまで一時的に元の場面が操作可能となり，キー入力で場面を進められます．<br>修正案：読込中オーバーレイを維持するか，全文表示の準備完了まで入力をロックします．</li>
</ul>

<p>なお，現在の環境が読み取り専用のため，指定ルールにあるレビューHTMLファイルの作成と <code>open</code> は実行していません．レビュー結果は上記のHTML形式で提示しています．</p>
