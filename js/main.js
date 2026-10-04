document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".nav");
    const toggle = document.querySelector(".nav__toggle");
    const menu = document.querySelector("#nav-menu");

    const links = [...document.querySelectorAll(".nav__link")];
    const sections = [...document.querySelectorAll("main section[id]")];

    let isNavigating = false;
    let navigationTimer = null;

    /*
     * Section yang "dikunci" sebagai aktif selama scroll hasil klik
     * navbar berlangsung, supaya tidak berkedip melewati section lain.
     */
    let lockedId = null;
    let lockTimer = null;


    /* =========================================================
       ACTIVE NAVIGATION
       (menggantikan IntersectionObserver lama)

       Masalah lama: observer hanya "melihat" garis tipis di rentang
       30%-45% tinggi layar. Section terakhir (Contact) pendek, jadi
       saat halaman sudah mentok di bawah, bagian atasnya berhenti
       di ~60% layar dan tidak pernah menyentuh garis itu -> section
       sebelumnya (Menu) yang tetap dianggap aktif.
    ========================================================= */

    const setActive = (id) => {
        links.forEach((link) => {
            link.classList.toggle(
                "is-active",
                link.getAttribute("href") === `#${id}`
            );
        });
    };

    const getCurrentSectionId = () => {
        if (!sections.length) return null;

        const doc = document.documentElement;

        const atBottom =
            Math.ceil(window.scrollY + window.innerHeight) >=
            doc.scrollHeight - 2;

        /*
         * Sudah mentok di bawah halaman -> section terakhir aktif.
         */
        if (atBottom) {
            return sections[sections.length - 1].id;
        }

        /*
         * Selain itu: section terakhir yang bagian atasnya sudah
         * melewati garis acuan (35% tinggi layar).
         */
        const line = window.innerHeight * 0.35;

        let current = sections[0];

        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= line) {
                current = section;
            }
        });

        return current.id;
    };

    const updateActive = () => {
        if (lockedId) {
            setActive(lockedId);
            return;
        }

        const id = getCurrentSectionId();

        if (id) setActive(id);
    };

    const releaseLock = () => {
        lockedId = null;
        updateActive();
    };

    const lockActive = (id) => {
        lockedId = id;
        setActive(id);

        window.clearTimeout(lockTimer);

        /*
         * Cadangan: lepas kunci setelah 1,2 detik. Selama scroll
         * berjalan, timer ini di-reset oleh event scroll (lihat bawah).
         */
        lockTimer = window.setTimeout(releaseLock, 1200);
    };


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
    updateActive();

    window.addEventListener(
        "scroll",
        () => {
            updateNavbar();

            if (lockedId) {
                /*
                 * Scroll hasil klik navbar masih berjalan. Lepas kunci
                 * ketika scroll sudah berhenti selama 150ms.
                 */
                window.clearTimeout(lockTimer);
                lockTimer = window.setTimeout(releaseLock, 150);
            } else {
                updateActive();
            }
        },
        { passive: true }
    );

    window.addEventListener(
        "resize",
        updateActive,
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

        /*
         * Tandai link yang diklik sebagai aktif sejak awal.
         */
        lockActive(target.id);


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