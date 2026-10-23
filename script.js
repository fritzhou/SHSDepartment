document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');

  if (menuButton && navigation) {
    function setMenu(isOpen) {
      navigation.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.textContent = isOpen ? 'Close' : 'Menu';
    }

    menuButton.addEventListener('click', () => {
      setMenu(!navigation.classList.contains('is-open'));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        setMenu(false);
        menuButton.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) {
        setMenu(false);
      }
    });
  }

  const year = new Date().getFullYear();

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = year;
  });
});
