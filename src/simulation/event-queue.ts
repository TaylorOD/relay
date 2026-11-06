import type { Event } from './types.ts'

// A stable min heap keeps event order independent of wall clock or render rate.
export class EventQueue {
  private items: Event[] = []

  get length() {
    return this.items.length
  }
  peek() {
    return this.items[0]
  }
  before(a: Event, b: Event) {
    return a.at < b.at || (a.at === b.at && a.seq < b.seq)
  }
  push(event: Event) {
    const items = this.items
    items.push(event)
    let index = items.length - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (!this.before(items[index], items[parent])) break
      ;[items[index], items[parent]] = [items[parent], items[index]]
      index = parent
    }
  }
  pop(): Event | undefined {
    const head = this.items[0]
    const last = this.items.pop()
    if (this.items.length && last) {
      this.items[0] = last
      let index = 0
      while (true) {
        let childIndex = index * 2 + 1
        if (childIndex >= this.items.length) break
        if (
          childIndex + 1 < this.items.length &&
          this.before(this.items[childIndex + 1], this.items[childIndex])
        )
          childIndex++
        if (!this.before(this.items[childIndex], this.items[index])) break
        ;[this.items[index], this.items[childIndex]] = [this.items[childIndex], this.items[index]]
        index = childIndex
      }
    }
    return head
  }
}
