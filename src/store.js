import { scan, distinctUntilChanged } from "rxjs/operators"
import shareLast from "./share-last"

export default function createStore$(initialValue) {
  return function store(source$) {
    return source$.pipe(
      scan((state, changeFn) => changeFn(state), initialValue),
      distinctUntilChanged((s1, s2) => s1.equals(s2)),
      shareLast
    )
  }
}
