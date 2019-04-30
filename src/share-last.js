import { publishReplay, refCount } from 'rxjs/operators'

export default function shareLast(source) {
  return source.pipe(
    publishReplay(1),
    refCount()
  )
}
