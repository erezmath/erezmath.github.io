<script>
    // Store the SVG icons as strings to keep the code clean
    const whatsappIcon = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
    const copyIcon = `<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;

    // Helper functions for the buttons (same as before)
    const getBaseUrl = () => window.location.origin + window.location.pathname;

    window.copyLink = function(buttonElement, lessonId) {
        const linkToCopy = `${getBaseUrl()}#${lessonId}`;
        navigator.clipboard.writeText(linkToCopy).then(() => {
            buttonElement.classList.add('show-tooltip');
            setTimeout(() => buttonElement.classList.remove('show-tooltip'), 2000);
        });
    };

    window.shareWhatsApp = function(lessonId, lessonTitle) {
        const linkToShare = `${getBaseUrl()}#${lessonId}`;
        const message = `בדוק את השיעור הזה ממתמטיקה: ${lessonTitle}\n\n${linkToShare}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    // The core logic: Listen for the "toggle" event on the document
    document.addEventListener('toggle', function(event) {
        // Only proceed if it's a details element and it is opening
        if (event.target.tagName === 'DETAILS' && event.target.open) {
            const lessonCard = event.target;
            const contentDiv = lessonCard.querySelector('.lesson-content');
            
            // 1. Check if we already injected the footer. If yes, stop here!
            if (contentDiv.querySelector('.share-footer')) return;

            // 2. Gather data
            const lessonId = lessonCard.id;
            const lessonTitle = lessonCard.getAttribute('data-title') || 'שיעור מתמטיקה';

            // 3. Build the HTML string
            const footerHTML = `
                <div class="share-footer">
                    <button class="share-btn whatsapp" onclick="shareWhatsApp('${lessonId}', '${lessonTitle}')" aria-label="שתף בוואטסאפ">
                        ${whatsappIcon}
                    </button>
                    <button class="share-btn copy" onclick="copyLink(this, '${lessonId}')" aria-label="העתק קישור">
                        ${copyIcon}
                        <span class="tooltip">הקישור הועתק!</span>
                    </button>
                </div>
            `;

            // 4. Inject it into the DOM at the bottom of the lesson content
            contentDiv.insertAdjacentHTML('beforeend', footerHTML);
        }
    }, true); // Use capture phase to catch the toggle event properly
</script>