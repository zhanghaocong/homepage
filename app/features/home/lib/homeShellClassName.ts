import type { HomeState } from '~/features/home/state/homeState'

function isPhotoViewPhase(phase: HomeState['phase']) {
  return phase === 'photoView' || phase === 'photoViewExit'
}

export function homeShellClassName(state: HomeState): string {
  const classes = ['xhr-wrap']
  const { shell, phase } = state

  if (shell.loadBefore) classes.push('is-load__before')
  if (shell.load) classes.push('is-load')
  if (shell.gather) classes.push('is-gather')
  if (shell.photoViewExit) classes.push('is-photo-view-exit')
  if (phase === 'photoView') {
    classes.push('is-photo-view-open', 'l-photo-view', 'l-cate')
  }

  return classes.join(' ')
}

export function homeWrapClassName(state: HomeState): string {
  return `js-wrapper p-home${isPhotoViewPhase(state.phase) ? ' is-photo-view-locked' : ''}`
}
