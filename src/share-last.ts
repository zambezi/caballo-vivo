import { publishReplay, refCount } from 'rxjs/operators'
import { Observable } from 'rxjs'

export default function shareLast<T>(source: Observable<T>) {
  return source.pipe(publishReplay(1), refCount())
}
