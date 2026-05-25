import { useAtomValue } from "jotai/react";
import { Link, NavLink, useLocation } from "react-router";
import { ThemeToggle } from "~/components/ThemeToggle";
import { closePhotoView } from "~/lib/photoViewController";
import { photoViewAtom, photoViewStore } from "~/lib/photoViewStore";

export function Header() {
	const { pathname } = useLocation();
	const photoViewOpen = useAtomValue(photoViewAtom, { store: photoViewStore }).open;
	const showClose = pathname !== "/" || photoViewOpen;

	return (
		<header className="l-header site-header">
			<div className="l-header__inner site-header__inner">
				<h1 className="site-header__logo">
					<Link to="/" aria-label="Home">
						Placeholder
					</Link>
				</h1>
				<nav className="site-header__nav">
					{showClose ? (
						photoViewOpen ? (
							<button
								type="button"
								className="site-header__link site-header__link--close"
								onClick={() => closePhotoView()}
							>
								Close
							</button>
						) : (
							<NavLink to="/" className="site-header__link site-header__link--close">
								Close
							</NavLink>
						)
					) : (
						<>
							<NavLink to="/" end className="site-header__link">
								Works
							</NavLink>
							<NavLink to="/about" className="site-header__link">
								About
							</NavLink>
						</>
					)}
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
}
