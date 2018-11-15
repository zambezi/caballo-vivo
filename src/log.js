export default log

function log(label, map = x => x) {
  if (!global.localStorage) return
  if (!global.localStorage.getItem('cv-log')) return

  const nextLabel = `[ NXT > ${label} ]`
  const errorLabel = `[ ERR > ${label} ]`
  const completeLabel = `[ COM > ${label} ]`

  return console.groupCollapsed
    ? { next, error, complete }
    : { next: nextSimple, error: errorSimple, complete }

  function complete() {
    console.info(completeLabel)
  }

  function next(n) {
    console.groupCollapsed(nextLabel)
    console.log(map(n))
    console.groupEnd(nextLabel)
  }

  function error(e) {
    console.groupCollapsed(errorLabel)
    console.warn(e)
    console.groupEnd(errorLabel)
  }

  function nextSimple(n) {
    console.log(nextLabel, n)
  }

  function errorSimple(n) {
    console.error(errorLabel, n)
  }
}
