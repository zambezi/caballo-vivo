import { tap } from 'rxjs/operators'

import log from './log'

export default function flog(label, map = x => x) {
  return function flogOperator(obs$) {
    return obs$.pipe(tap(log(label, map)))
  }
}
