export function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar nav li[data-page]');
    const pages = document.querySelectorAll('.page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            
            // Update navigation visual state
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Handle page transitions with animation
            const currentPage = document.querySelector('.page.active');
            const newPage = document.getElementById(`${targetPage}-page`);
            
            if (currentPage) {
                // Exit animation for current page
                currentPage.classList.add('exiting');
                currentPage.classList.remove('active');
                
                setTimeout(() => {
                    currentPage.classList.remove('exiting');
                    currentPage.style.display = 'none';
                    
                    // Entry animation for new page
                    newPage.classList.add('entering');
                    newPage.style.display = 'block';
                    
                    // Force a reflow to ensure the animation works
                    newPage.offsetHeight;
                    
                    newPage.classList.add('active');
                    newPage.classList.remove('entering');
                }, 300);
            } else {
                newPage.classList.add('active');
            }
        });
    });
}