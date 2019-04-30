import { distinctUntilChanged as d,  } from 'rxjs/operators'
import { equals } from 'ramda'

export default function distinctUntilChanged(source) {
  return source.pipe(d(diligentEquals))
}

function diligentEquals(a, b) {
  if (typeof a.equals === 'function') return a.equals(b)
  return equals(a, b)
}

