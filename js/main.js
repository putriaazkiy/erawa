document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".nav");
    const toggle = document.querySelector(".nav__toggle");
    const menu = document.querySelector("#nav-menu");

    const links = [...document.querySelectorAll(".nav__link")];
    const sections = [...document.querySelectorAll("main section[id]")];

    let isNavigating = false;
    let navigationTimer = null;


    /* =========================================================
       MOBILE MENU
    ========================================================= */

    const closeMobileMenu = () => {
        if (!toggle || !menu) return;

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Buka menu");

        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");
    };


    /* =========================================================
       NAVBAR STATE
    ========================================================= */

    const updateNavbar = () => {
        if (!nav || isNavigating) return;

        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop;

        nav.classList.toggle(
            "navShadow",
            scrollTop > 50
        );
    };

    updateNavbar();

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );


    /* =========================================================
       NAVIGATION
    ========================================================= */

    document.addEventListener("click", (event) => {
        const link = event.target.closest(".nav__link");

        if (!link) return;

        const href = link.getAttribute("href");

        if (!href || !href.startsWith("#")) {
            return;
        }

        /*
         * Jangan mengambil alih klik yang dimaksudkan
         * untuk membuka link di tab/window lain.
         */
        if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
        ) {
            return;
        }

        const target = document.querySelector(href);

        if (!target) return;

        event.preventDefault();


        /* -----------------------------------------------------
           HOME
        ----------------------------------------------------- */

        if (href === "#home") {
            isNavigating = true;

            closeMobileMenu();

            if (nav) {
                nav.classList.remove("navShadow");
            }

            window.clearTimeout(navigationTimer);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            navigationTimer = window.setTimeout(() => {
                isNavigating = false;
                updateNavbar();
            }, 500);

            return;
        }


        /* -----------------------------------------------------
           SECTION LAIN
        ----------------------------------------------------- */

        closeMobileMenu();

        if (!nav) return;

        isNavigating = true;

        /*
         * Aktifkan navbar panjang terlebih dahulu.
         */
        nav.classList.add("navShadow");


        let finished = false;


       const scrollAfterNav = () => {
    if (finished) return;

    finished = true;

    nav.removeEventListener(
        "transitionend",
        onTransitionEnd
    );

    const navBottom =
        nav.getBoundingClientRect().bottom;

    const targetTop =
        window.scrollY +
        target.getBoundingClientRect().top;

    const scrollTarget =
        Math.max(
            0,
            targetTop - navBottom + 10
        );

    window.scrollTo({
        top: scrollTarget,
        behavior: "smooth"
    });

    window.clearTimeout(navigationTimer);

    navigationTimer = window.setTimeout(() => {
        isNavigating = false;
        updateNavbar();
    }, 600);
};

        const onTransitionEnd = (event) => {
            /*
             * Hanya respon terhadap transition navbar.
             */
            if (event.target !== nav) {
                return;
            }

            /*
             * Navbar mempunyai beberapa properti yang
             * berubah ketika .navShadow aktif.
             */
            if (
                event.propertyName === "height" ||
                event.propertyName === "width" ||
                event.propertyName === "top" ||
                event.propertyName === "border-radius"
            ) {
                scrollAfterNav();
            }
        };


        nav.addEventListener(
            "transitionend",
            onTransitionEnd
        );


        /*
         * Fallback.
         *
         * Kalau browser tidak mengirim transitionend,
         * scroll tetap dijalankan.
         */
        window.clearTimeout(navigationTimer);

        navigationTimer = window.setTimeout(
            scrollAfterNav,
            500
        );
    }, true);


    /* =========================================================
       MOBILE TOGGLE
    ========================================================= */

    if (toggle && menu) {
        toggle.addEventListener("click", (event) => {
            event.preventDefault();

            const isOpen =
                toggle.getAttribute("aria-expanded") === "true";

            const nextState = !isOpen;

            toggle.setAttribute(
                "aria-expanded",
                String(nextState)
            );

            toggle.setAttribute(
                "aria-label",
                nextState
                    ? "Tutup menu"
                    : "Buka menu"
            );

            menu.classList.toggle(
                "is-open",
                nextState
            );

            document.body.classList.toggle(
                "nav-open",
                nextState
            );
        });
    }


    /* =========================================================
       ACTIVE NAVIGATION
    ========================================================= */

    if (sections.length && links.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                const visibleSections = entries
                    .filter(
                        (entry) =>
                            entry.isIntersecting
                    )
                    .sort(
                        (a, b) =>
                            b.intersectionRatio -
                            a.intersectionRatio
                    );

                const visible =
                    visibleSections[0];

                if (!visible) return;

                const id =
                    `#${visible.target.id}`;

                links.forEach((link) => {
                    link.classList.toggle(
                        "is-active",
                        link.getAttribute("href") === id
                    );
                });
            },
            {
                rootMargin:
                    "-30% 0px -55% 0px",

                threshold: [
                    0,
                    0.1,
                    0.25,
                    0.5
                ]
            }
        );

        sections.forEach((section) => {
            observer.observe(section);
        });
    }


    /* =========================================================
       CLOSE MOBILE MENU WHEN CLICKING OUTSIDE
    ========================================================= */

    document.addEventListener("click", (event) => {
        if (!menu || !toggle) return;

        const isOpen =
            toggle.getAttribute("aria-expanded") === "true";

        if (!isOpen) return;

        if (
            !menu.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            closeMobileMenu();
        }
    });


    /* =========================================================
       ESCAPE KEY
    ========================================================= */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        closeMobileMenu();
    });
});