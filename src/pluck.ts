import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

type Key = string
type Path = string[]
type KeyOrPath = Key | Path

type Gettable = {
  get: (path: KeyOrPath, notSetValue: unknown) => unknown
  getIn: (path: KeyOrPath, notSetValue: unknown) => unknown
}

export default function pluck(keyOrPath: KeyOrPath, notSetValue: unknown) {
  return function pluck(source$: Observable<Gettable>) {
    return Array.isArray(keyOrPath)
      ? source$.pipe(map((x) => x.getIn(keyOrPath, notSetValue)))
      : source$.pipe(map((x) => x.get(keyOrPath, notSetValue)))
  }
}
