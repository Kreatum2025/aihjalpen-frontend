/**
 * WCAG 2.1 AA Tangentbordsnavigering - Kirurgisk implementation
 * Enligt instruktionsfilen: minimala event listeners för befintliga element
 * Påverkar INTE befintlig funktionalitet (caret-upgrade.js, main.js)
 */

document.addEventListener('DOMContentLoaded', function() {
    // DROPDOWN TANGENTBORDSNAVIGERING
    const dropdownTriggers = document.querySelectorAll('.nav-dropdown .dropdown-trigger, .nav-dropdown .nav-link');
    
    dropdownTriggers.forEach(trigger => {
        const dropdown = trigger.closest('.nav-dropdown');
        const menu = dropdown ? dropdown.querySelector('.dropdown-menu') : null;
        
        if (!menu) return;
        
        // Sätt aria-expanded på trigger om det inte finns
        if (!trigger.hasAttribute('aria-expanded')) {
            trigger.setAttribute('aria-expanded', 'false');
        }
        
        // KEYDOWN events för Enter/Space/Esc
        trigger.addEventListener('keydown', (e) => {
            const isOpen = menu.classList.contains('show');
            
            switch(e.key) {
                case 'Enter':
                case ' ': // Space
                    e.preventDefault();
                    toggleDropdown(trigger, menu);
                    break;
                    
                case 'Escape':
                    if (isOpen) {
                        e.preventDefault();
                        closeDropdown(trigger, menu);
                        trigger.focus(); // Återfokusera trigger
                    }
                    break;
                    
                case 'ArrowDown':
                    if (isOpen) {
                        e.preventDefault();
                        focusFirstMenuItem(menu);
                    } else {
                        e.preventDefault();
                        toggleDropdown(trigger, menu);
                        setTimeout(() => focusFirstMenuItem(menu), 50);
                    }
                    break;
            }
        });
    });
    
    // MENY-ITEM NAVIGERING (pil upp/ner inom dropdown)
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach((item) => {
        item.addEventListener('keydown', (e) => {
            const menu = item.closest('.dropdown-menu');
            const trigger = menu ? menu.closest('.nav-dropdown').querySelector('.dropdown-trigger, .nav-link') : null;
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    // BUGFIX: Hämta items endast från aktuell dropdown-meny
                    const menuItems = Array.from(menu.querySelectorAll('.dropdown-item'));
                    const currentIndex = menuItems.indexOf(item);
                    const nextItem = menuItems[currentIndex + 1] || menuItems[0];
                    nextItem.focus();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    // BUGFIX: Hämta items endast från aktuell dropdown-meny
                    const currentMenuItems = Array.from(menu.querySelectorAll('.dropdown-item'));
                    const currentIdx = currentMenuItems.indexOf(item);
                    const prevItem = currentMenuItems[currentIdx - 1] || currentMenuItems[currentMenuItems.length - 1];
                    prevItem.focus();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    if (trigger && menu) {
                        closeDropdown(trigger, menu);
                        trigger.focus();
                    }
                    break;
                    
                case 'Tab':
                    // Låt naturlig tab-hantering stänga dropdown
                    if (menu && trigger) {
                        setTimeout(() => closeDropdown(trigger, menu), 0);
                    }
                    break;
            }
        });
    });
    
    // ACCORDION TANGENTBORDSNAVIGERING (Mobile-menu)
    // Exkludera .menu-toggle som hanteras av main.js för att undvika ARIA-konflikter
    const accordionTriggers = document.querySelectorAll('.mobile-acc-trigger, .dropdown-trigger');
    accordionTriggers.forEach(trigger => {
        if (trigger.classList.contains('dropdown-trigger')) return; // Redan hanterad ovan
        
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click(); // Använd befintlig click-hanterare
            }
        });
    });
    
    // HJÄLPFUNKTIONER
    function toggleDropdown(trigger, menu) {
        const isOpen = menu.classList.contains('show');
        
        if (isOpen) {
            closeDropdown(trigger, menu);
        } else {
            openDropdown(trigger, menu);
        }
    }
    
    function openDropdown(trigger, menu) {
        // Stäng andra dropdowns först (följer befintlig logik)
        document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
            if (otherMenu !== menu) {
                const otherTrigger = otherMenu.closest('.nav-dropdown').querySelector('.dropdown-trigger, .nav-link');
                closeDropdown(otherTrigger, otherMenu);
            }
        });
        
        menu.classList.add('show');
        trigger.setAttribute('aria-expanded', 'true');
    }
    
    function closeDropdown(trigger, menu) {
        menu.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
    }
    
    function focusFirstMenuItem(menu) {
        const firstItem = menu.querySelector('.dropdown-item');
        if (firstItem) {
            firstItem.focus();
        }
    }
    
    // Stäng dropdowns med Escape på document-nivå
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
            openDropdowns.forEach(menu => {
                const trigger = menu.closest('.nav-dropdown').querySelector('.dropdown-trigger, .nav-link');
                if (trigger) {
                    closeDropdown(trigger, menu);
                }
            });
        }
    });
});