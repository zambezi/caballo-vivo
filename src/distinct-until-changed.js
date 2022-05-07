import { distinctUntilChanged as d } from 'rxjs/operators'
import { equals } from 'ramda'

const distinctUntilChanged = d(equals)

export default distinctUntilChanged
