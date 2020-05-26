import { scan, distinctUntilChanged } from 'rxjs/operators'
import shareLast from './share-last'
import { Observable } from 'rxjs'

interface Comparable<T> {
  equals: (other: Comparable<T>) => boolean
}

type Reducer<S> = (state: S) => S

type ComparableState<T> = T & Comparable<T>

export default function createStore<T>(initialValue: ComparableState<T>) {
  return function store(source$: Observable<Reducer<ComparableState<T>>>) {
    return source$.pipe(
      scan<Reducer<ComparableState<T>>, ComparableState<T>>(
        (state, changeFn) => changeFn(state),
        initialValue
      ),
      distinctUntilChanged((s1: ComparableState<T>, s2: ComparableState<T>) =>
        s1.equals(s2)
      ),
      shareLast
    )
  }
}
