// テスト共通の準備（vitest.config.ts の setupFiles で読み込む）

// jsdom は <dialog> の showModal() / close() を実装していないので、open 属性の切り替えだけを足す
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
