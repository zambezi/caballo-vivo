import { Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import log from './log'

export const followLink$ = new Subject().pipe(tap(log('Follow link')))
export const jumpBack$ = new Subject().pipe(tap(log('Jump back in history')))
export const followAnchor$ = new Subject().pipe(tap(log('Follow anchor')))
