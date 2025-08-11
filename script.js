// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            // Remove active class from all links and sections
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
});

// Project expansion functionality
function toggleProject(element) {
    const details = element.parentElement.nextElementSibling;
    const isVisible = details.classList.contains('show');
    
    // Close all other project details
    document.querySelectorAll('.project-details').forEach(detail => {
        detail.classList.remove('show');
    });
    
    // Toggle current project details
    if (isVisible) {
        details.classList.remove('show');
    } else {
        details.classList.add('show');
    }
}

// Essay expansion functionality
function toggleEssay(element) {
    const details = element.parentElement.nextElementSibling;
    const isVisible = details.classList.contains('show');
    
    // Close all other essay details
    document.querySelectorAll('.essay-details').forEach(detail => {
        detail.classList.remove('show');
    });
    
    // Toggle current essay details
    if (isVisible) {
        details.classList.remove('show');
    } else {
        details.classList.add('show');
    }
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    const activeLink = document.querySelector('.nav-link.active');
    const navLinks = document.querySelectorAll('.nav-link');
    const currentIndex = Array.from(navLinks).indexOf(activeLink);
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navLinks.length - 1;
        navLinks[prevIndex].click();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < navLinks.length - 1 ? currentIndex + 1 : 0;
        navLinks[nextIndex].click();
    }
});

// Close expanded items when clicking outside
document.addEventListener('click', function(e) {
    const projectLinks = document.querySelectorAll('.project-link');
    const essayLinks = document.querySelectorAll('.essay-link');
    
    // Check if click is outside of project items
    let clickedInsideProject = false;
    projectLinks.forEach(link => {
        const projectItem = link.closest('.project-item');
        if (projectItem && projectItem.contains(e.target)) {
            clickedInsideProject = true;
        }
    });
    
    // Check if click is outside of essay items
    let clickedInsideEssay = false;
    essayLinks.forEach(link => {
        const essayItem = link.closest('.essay-item');
        if (essayItem && essayItem.contains(e.target)) {
            clickedInsideEssay = true;
        }
    });
    
    // Close project details if clicked outside
    if (!clickedInsideProject) {
        document.querySelectorAll('.project-details').forEach(detail => {
            detail.classList.remove('show');
        });
    }
    
    // Close essay details if clicked outside
    if (!clickedInsideEssay) {
        document.querySelectorAll('.essay-details').forEach(detail => {
            detail.classList.remove('show');
        });
    }
}); 