import { site } from '~/shared/data/site'
import { galleryText } from '~/features/home/galleryTypography'

/** Static shell for SSR / pre-hydration — matches splash layout without WebGL or controller. */
export function HomePageFallback() {
  return (
    <div className="xhr-wrap is-load__before" data-xhr-namespace="home">
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
            <h1 className={`${galleryText.xxl} uppercase`}>{site.name}</h1>
          </div>
          <div className="l-splash__bottom">
            <div className="l-splash__tag">
              <img src="/assets/img/tag.svg" alt="" />
            </div>
            <p className={`l-splash__text ${galleryText.s}`}>{site.description}</p>
            <p className={`l-splash__loader ${galleryText.l}`}>
              <span className="l-splash__num">000</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
