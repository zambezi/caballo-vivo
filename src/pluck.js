import { map } from 'rxjs/operators'

export default function pluck(keyOrPath, notSetValue) {
  return function pluck(source) {
    return Array.isArray(keyOrPath)
      ? source.pipe(map(x => x.getIn(keyOrPath, notSetValue)))
      : source.pipe(map(x => x.get(keyOrPath, notSetValue)))
  }
}
