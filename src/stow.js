import { map } from 'rxjs/operators'

export default function stow(keyOrPath) {
  return function stow(source$) {
    return source$.pipe(
      map(value => state =>
        Array.isArray(keyOrPath)
          ? state.setIn(keyOrPath, value)
          : state.set(keyOrPath, value)
      )
    )
  }
}
