import { site } from '~/shared/data/site'

function Scope() {
  return (
    <div className="p-home__scope c-scope --grid">
      <span className="l l1" />
      <span className="l l2" />
      <span className="l l3" />
      <span className="l l4" />
    </div>
  )
}

function SplashLetters({ text, phase }: { text: string; phase: 'in' | 'out' }) {
  return (
    <div className={phase}>
      {text.split('').map((ch, index) => (
        <span key={`${phase}-${index}`}>{ch === ' ' ? '\u00a0' : ch}</span>
      ))}
    </div>
  )
}

export function GallerySplash() {
  return (
    <div className="l-splash">
      <div className="l-splash__front">
        <div className="l-splash__front-wrap">
          <div className="l-splash__front-inner">
            <div className="l-splash__front--image">
              <img src="/assets/img/f.jpg.webp" alt="" />
            </div>
          </div>
        </div>
        <div className="l-splash__front-bg" />
      </div>
      <div className="l-splash__back">
        <div className="l-splash__title">
          <h1 className="fs-xxl u-upper">
            <SplashLetters text={site.name} phase="in" />
            <SplashLetters text={site.name} phase="out" />
          </h1>
        </div>
        <div className="l-splash__middle">
          <Scope />
          <Scope />
        </div>
        <div className="l-splash__bottom">
          <div className="l-splash__tag">
            <img src="/assets/img/tag.svg" alt="" />
          </div>
          <p className="l-splash__text fs-s">{site.description}</p>
          <p className="l-splash__loader fs-l">
            <span className="l-splash__num">000</span>
          </p>
        </div>
      </div>
    </div>
  )
}
