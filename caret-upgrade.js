
// js/caret-upgrade.js (produktion)
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll(
    '.nav-dropdown > a, .nav-dropdown > .nav-link'
  );

  links.forEach(link => {
    // redan uppgraderad?
    if (link.querySelector('.caret-icon')) return;

    // hitta alla textnoder i länken (även djupt nästlade)
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.textContent.trim()) nodes.push(n);
    }

    // regex för pilar i slutet av text
    const re = /[↓▾▿ᐯ∨]\s*$/;

    let removedAny = false;
    nodes.forEach(node => {
      const txt = node.textContent;
      if (re.test(txt)) {
        node.textContent = txt.replace(re, '').trimEnd();
        removedAny = true;
      }
    });

    // Lägg alltid till SVG-caret för dropdown-länkar, även om ingen pil hittades
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'caret-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'inline-block';
    svg.style.marginLeft = '0.35rem';
    svg.style.verticalAlign = 'middle';

    const pl = document.createElementNS(svgNS, 'polyline');
    pl.setAttribute('points', '6 9 12 15 18 9');
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', 'currentColor');
    pl.setAttribute('stroke-width', '2');
    pl.setAttribute('stroke-linecap', 'round');
    pl.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(pl);
    link.appendChild(svg);
  });

  // Lägg till dropdown-hantering
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  
  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('a, .nav-link');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (trigger && menu) {
      // Ta bort eventuella befintliga lyssnare genom att klona elementet
      const newTrigger = trigger.cloneNode(true);
      trigger.parentNode.replaceChild(newTrigger, trigger);
      
      newTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Stäng alla andra dropdowns först
        dropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            const otherMenu = otherDropdown.querySelector('.dropdown-menu');
            if (otherMenu) {
              otherMenu.classList.remove('show');
            }
          }
        });
        
        // Toggle aktuell dropdown
        menu.classList.toggle('show');
      });
    }
  });

  // Stäng dropdowns när man klickar utanför
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(dropdown => {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          menu.classList.remove('show');
        }
      });
    }
  });
});
