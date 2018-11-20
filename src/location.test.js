import rxjs from 'rxjs'
import { createLocation$ } from './location'

test('Create location with empty pathToIntent', () => {
  const location$ = createLocation$({})
  expect(location$ instanceof rxjs.Observable).toBe(true)
})
