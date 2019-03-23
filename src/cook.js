import { curry, __ } from "ramda"
import { map } from "rxjs/operators"

export default function cook(reducer) {
  return function cook(source$) {
    return source$.pipe(map(next => curry(reducer)(__, next)))
  }
}
