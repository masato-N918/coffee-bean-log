/** API が 404 を返したとき（指定した豆・抽出記録が見つからない） */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}
