import type { HomeState } from '~/features/home/state/homeState'

export function homeShellClassName(state: HomeState): string {
  const classes = ['xhr-wrap']
  const { shell, photoViewOpen } = state

  if (shell.loadBefore) classes.push('is-load__before')
  if (shell.load) classes.push('is-load')
  if (shell.gather) classes.push('is-gather')
  if (shell.photoViewExit) classes.push('is-photo-view-exit')
  if (photoViewOpen) {
    classes.push('is-photo-view-open', 'l-photo-view', 'l-cate')
  }

  return classes.join(' ')
}

export function homeWrapClassName(state: HomeState): string {
  return `js-wrapper p-home${state.photoViewOpen ? ' is-photo-view-locked' : ''}`
}
