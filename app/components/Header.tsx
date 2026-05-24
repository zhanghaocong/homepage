import { Link, NavLink, useLocation } from "react-router";

export function Header() {
	const { pathname } = useLocation();
	const isSubpage = pathname !== "/";

	return (
		<header className="l-header site-header">
			<div className="l-header__inner site-header__inner">
				<h1 className="site-header__logo">
					<Link to="/" aria-label="Home">
						Placeholder
					</Link>
				</h1>
				<nav className="site-header__nav">
					{isSubpage ? (
						<NavLink to="/" className="site-header__link site-header__link--close">
							Close
						</NavLink>
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
				</nav>
			</div>
		</header>
	);
}
