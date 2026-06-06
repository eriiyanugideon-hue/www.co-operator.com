console.log('Hello');
console.log('Start');

const userStorageKey = 'coOperatorUser';
const legacyUserStorageKey = 'egoUser';
const maxAIWordTarget = 100000;

// Check for persistent login on page load
window.onload = function() {
    loadThemePreference();
    const savedUser = localStorage.getItem(userStorageKey) || localStorage.getItem(legacyUserStorageKey);
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (!localStorage.getItem(userStorageKey) && localStorage.getItem(legacyUserStorageKey)) {
            localStorage.setItem(userStorageKey, savedUser);
        }
        document.getElementById("landingPage").style.display = 'none';
        document.getElementById("mainApp").style.display = 'block';
        document.getElementById("myH1").textContent = `Welcome back ${userData.username}!`;
        initializeProfile(userData.username);
        showPage('home', document.getElementById('homeNav'));
        renderFeaturedStories();
        loadStories();
    }
};

function openProviderAuth(url, username, age) {
    window.open(url, '_blank');
    simulateSocialLogin(username, age);
}

function initializeProfile(username) {
    const nameEl = document.getElementById('profileName');
    if (nameEl) {
        nameEl.textContent = username || 'Guest';
    }
    setRandomProfileAvatar(username || 'Guest');
}

function setRandomProfileAvatar(seed) {
    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        const encoded = encodeURIComponent(seed || 'Guest');
        avatar.src = `https://api.dicebear.com/6.x/adventurer/svg?seed=${encoded}&scale=90`;
    }
}

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-twilight', 'theme-forest');
    body.classList.add(`theme-${theme}`);
    localStorage.setItem('coOperatorTheme', theme);
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = theme;
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) darkToggle.checked = (theme === 'dark');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('coOperatorTheme') || 'light';
    applyTheme(savedTheme);
    const accentColor = localStorage.getItem('coOperatorAccent') || '#4CAF50';
    const accentPicker = document.getElementById('accentColorPicker');
    if (accentPicker) {
        accentPicker.value = accentColor;
        setAccentColor(accentColor);
    }
}

function setAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('coOperatorAccent', color);
}

// Social login handlers
document.getElementById("googleSignIn").onclick = function() {
    openProviderAuth('https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn', 'Google User', 12);
};

document.getElementById("microsoftSignIn").onclick = function() {
    openProviderAuth('https://login.live.com/oauth20_authorize.srf', 'Microsoft User', 13);
};

document.getElementById("appleSignIn").onclick = function() {
    openProviderAuth('https://appleid.apple.com/auth/authorize', 'Apple User', 14);
};

function simulateSocialLogin(username, age) {
    // Simulate successful social login
    document.getElementById("landingPage").style.display = 'none';
    document.getElementById("mainApp").style.display = 'block';
    document.getElementById("myH1").textContent = `Welcome ${username}!`;
    showPage('home', document.getElementById('homeNav'));

    // Save social login data
    const userData = {
        username: username,
        age: age,
        loginMethod: 'social',
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(userStorageKey, JSON.stringify(userData));
    initializeProfile(username);

    renderFeaturedStories();
    loadStories();
}

// Landing page sign-in
document.getElementById("landingSignInForm").onsubmit = function(event) {
    event.preventDefault();
    const username = document.getElementById("landingUsername").value;
    const password = document.getElementById("landingPassword").value;
    const age = parseInt(document.getElementById("landingAge").value);
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!username || !password || isNaN(age)) {
        document.getElementById("landingGreeting").textContent = 'Please fill in all fields.';
    } else if (age < 10) {
        document.getElementById("landingGreeting").textContent = 'You must be at least 10 years old to sign in.';
    } else {
        // Successful sign-in - show main app
        document.getElementById("landingPage").style.display = 'none';
        document.getElementById("mainApp").style.display = 'block';
        document.getElementById("myH1").textContent = `Welcome ${username}!`;
        showPage('home', document.getElementById('homeNav'));

        // Save user data if remember me is checked
        if (rememberMe) {
            const userData = {
                username: username,
                age: age,
                loginMethod: 'traditional',
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(userStorageKey, JSON.stringify(userData));
        }

        // Load stories
        renderFeaturedStories();
        loadStories();
    }
};

// Navigation
document.getElementById("homeNav").onclick = function() {
    showPage('home', this);
};

document.getElementById("aboutNav").onclick = function() {
    showPage('about', this);
};

document.getElementById("storiesNav").onclick = function() {
    showPage('stories', this);
    renderFeaturedStories();
};

document.getElementById("encyclopediaNav").onclick = function() {
    showPage('encyclopedia', this);
};

document.getElementById("chatNav").onclick = function() {
    showPage('aiChat', this);
};

document.getElementById("settingsIconBtn").onclick = function() {
    showPage('settings', this);
};

// Word Processor Functionality
class WordProcessor {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.pages = {};
        this.documentTitle = '';
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadExistingPages();

        if (!this.pages[1]) {
            this.createPage(1);
        }

        this.showPage(this.currentPage);
        this.updateStats();
    }

    loadExistingPages() {
        const existingPages = document.querySelectorAll('.document-pages .page');
        existingPages.forEach(page => {
            const pageNumber = parseInt(page.id.replace('page', ''), 10);
            if (!isNaN(pageNumber)) {
                this.pages[pageNumber] = {
                    element: page,
                    content: page.querySelector('.page-text'),
                    title: page.querySelector('.page-title')
                };
                if (pageNumber > this.totalPages) {
                    this.totalPages = pageNumber;
                }
                if (pageNumber === 1 && this.pages[1].title.value) {
                    this.documentTitle = this.pages[1].title.value;
                }
            }
        });
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('newDocument').addEventListener('click', () => this.newDocument());
        document.getElementById('saveDocument').addEventListener('click', () => this.saveDocument());
        document.getElementById('exportDocument').addEventListener('click', () => this.exportDocument());
        document.getElementById('openDictionary').addEventListener('click', () => this.openDictionary());

        // Dictionary modal
        document.getElementById('closeDictionary').addEventListener('click', () => this.closeDictionary());
        document.getElementById('dictionaryOverlay').addEventListener('click', () => this.closeDictionary());
        document.getElementById('searchWord').addEventListener('click', () => {
            const word = document.getElementById('dictionarySearch').value;
            this.searchWord(word);
        });
        document.getElementById('dictionarySearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const word = e.target.value;
                this.searchWord(word);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+D or Cmd+D to open dictionary
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.openDictionary();
            }
            // Escape to close dictionary
            if (e.key === 'Escape' && document.getElementById('dictionaryModal').classList.contains('active')) {
                this.closeDictionary();
            }
        });

        // Formatting buttons
        document.getElementById('boldBtn').addEventListener('click', () => this.toggleFormat('bold'));
        document.getElementById('italicBtn').addEventListener('click', () => this.toggleFormat('italic'));
        document.getElementById('underlineBtn').addEventListener('click', () => this.toggleFormat('underline'));

        // Font controls
        document.getElementById('fontFamilySelect').addEventListener('change', (e) => this.applyFontStyle('fontFamily', e.target.value));
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => this.applyFontStyle('fontSize', e.target.value));
        document.getElementById('fontColorPicker').addEventListener('input', (e) => this.applyFontStyle('color', e.target.value));

        // Navigation
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        document.getElementById('addPage').addEventListener('click', () => this.addNewPage());

        // Title input
        document.getElementById('documentTitle').addEventListener('input', (e) => {
            this.documentTitle = e.target.value;
        });

        // Content editing
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('page-text')) {
                this.updateStats();
                this.checkPageOverflow();
            }
        });

        // Publish
        document.getElementById('publishDocument').addEventListener('click', () => this.publishDocument());
    }

    createPage(pageNumber) {
        if (this.pages[pageNumber]) return;

        const pageContainer = document.querySelector('.document-pages');
        const page = document.createElement('div');
        page.className = 'page';
        page.id = `page${pageNumber}`;

        page.innerHTML = `
            <div class="page-header">
                <input type="text" class="page-title" placeholder="Untitled Document" value="${pageNumber === 1 ? this.documentTitle : ''}">
            </div>
            <div class="page-content">
                <div id="pageContent${pageNumber}" class="page-text" contenteditable="true" data-placeholder="Start writing your story here..."></div>
            </div>
            <div class="page-footer">
                <span class="page-number">${pageNumber}</span>
            </div>
        `;

        pageContainer.appendChild(page);
        this.pages[pageNumber] = {
            element: page,
            content: page.querySelector('.page-text'),
            title: page.querySelector('.page-title')
        };

        // Add title change listener
        this.pages[pageNumber].title.addEventListener('input', (e) => {
            if (pageNumber === 1) {
                this.documentTitle = e.target.value;
            }
        });
    }

    showPage(pageNumber) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            page.element.classList.remove('active', 'leaving', 'entering');
            page.element.style.display = 'none';
        });

        // Show target page with animation
        if (this.pages[pageNumber]) {
            const targetPage = this.pages[pageNumber].element;
            targetPage.style.display = 'block';
            targetPage.classList.add('active');
        }

        this.currentPage = pageNumber;
        this.updateNavigation();
        this.updatePageIndicator();
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.pages[this.currentPage].element.classList.add('leaving');
            setTimeout(() => {
                this.showPage(this.currentPage + 1);
            }, 300);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.pages[this.currentPage].element.classList.add('leaving');
            setTimeout(() => {
                this.showPage(this.currentPage - 1);
            }, 300);
        }
    }

    addNewPage() {
        this.totalPages++;
        this.createPage(this.totalPages);
        this.showPage(this.totalPages);
        this.updateStats();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
    }

    updatePageIndicator() {
        document.getElementById('pageIndicator').textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }

    updateStats() {
        let totalWords = 0;
        let totalChars = 0;

        Object.values(this.pages).forEach(page => {
            const content = page.content.textContent || '';
            const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
            totalWords += words;
            totalChars += content.length;
        });

        document.getElementById('totalWords').textContent = totalWords;
        document.getElementById('totalPages').textContent = this.totalPages;
        document.getElementById('totalChars').textContent = totalChars;
    }

    checkPageOverflow() {
        const currentPageContent = this.pages[this.currentPage].content;
        const content = currentPageContent.textContent || '';
        const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

        // If page has too many words, suggest adding a new page
        if (words > 500 && this.currentPage === this.totalPages) {
            // Auto-suggest adding a new page
            const addPageBtn = document.getElementById('addPage');
            addPageBtn.style.animation = 'pulse 1s infinite';
            setTimeout(() => {
                addPageBtn.style.animation = '';
            }, 3000);
        }
    }

    toggleFormat(format) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const currentPage = this.pages[this.currentPage].content;

        // Check if selection is within current page
        if (!currentPage.contains(range.commonAncestorContainer)) return;

        document.execCommand(format, false, null);

        // Update button state
        this.updateFormatButtons();
    }

    updateFormatButtons() {
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');

        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
    }

    applyFontStyle(property, value) {
        const currentPage = this.pages[this.currentPage].content;
        if (!currentPage) return;

        if (property === 'fontFamily') {
            currentPage.style.fontFamily = value;
        } else if (property === 'fontSize') {
            currentPage.style.fontSize = value;
        } else if (property === 'color') {
            currentPage.style.color = value;
        }
    }

    newDocument() {
        if (confirm('Are you sure you want to start a new document? Any unsaved changes will be lost.')) {
            // Clear all pages
            Object.values(this.pages).forEach(page => page.element.remove());
            this.pages = {};
            this.currentPage = 1;
            this.totalPages = 1;
            this.documentTitle = '';

            // Create first page
            this.createPage(1);
            this.showPage(1);
            this.updateStats();
        }
    }

    saveDocument() {
        const documentData = {
            title: this.documentTitle || 'Untitled Document',
            pages: {},
            timestamp: new Date().toISOString(),
            totalPages: this.totalPages
        };

        Object.keys(this.pages).forEach(pageNum => {
            documentData.pages[pageNum] = {
                title: this.pages[pageNum].title.value,
                content: this.pages[pageNum].content.innerHTML
            };
        });

        // Save to localStorage
        const documents = JSON.parse(localStorage.getItem('wordProcessorDocuments') || '[]');
        documents.push(documentData);
        localStorage.setItem('wordProcessorDocuments', JSON.stringify(documents));

        alert(`Document saved! "${documentData.title}" (${this.totalPages} pages)`);
    }

    exportDocument() {
        let fullContent = '';

        Object.keys(this.pages).forEach(pageNum => {
            const page = this.pages[pageNum];
            fullContent += `\n\n--- Page ${pageNum} ---\n\n`;
            if (page.title.value) {
                fullContent += `${page.title.value}\n\n`;
            }
            fullContent += page.content.textContent + '\n';
        });

        const blob = new Blob([fullContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.documentTitle || 'Untitled Document'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    publishDocument() {
        let fullContent = '';
        let totalWords = 0;

        Object.keys(this.pages).forEach(pageNum => {
            const page = this.pages[pageNum];
            fullContent += page.content.textContent + ' ';
            const words = page.content.textContent.trim() === '' ? 0 : page.content.textContent.trim().split(/\s+/).length;
            totalWords += words;
        });

        if (totalWords < 1000) {
            alert(`Your story needs at least 1000 words to be published. You currently have ${totalWords} words.`);
            return;
        }

        const story = {
            title: this.documentTitle || 'Untitled Story',
            content: fullContent.trim(),
            timestamp: new Date().toISOString(),
            wordCount: totalWords,
            pages: this.totalPages
        };

        // Save to published stories
        const publishedStories = JSON.parse(localStorage.getItem('publishedStories') || '[]');
        publishedStories.push(story);
        localStorage.setItem('publishedStories', JSON.stringify(publishedStories));

        alert(`Story published! "${story.title}" (${story.wordCount} words, ${story.pages} pages)`);

        // Clear document
        this.newDocument();
    }

    // Dictionary functionality
    openDictionary() {
        const modal = document.getElementById('dictionaryModal');
        modal.classList.add('active');
        document.getElementById('dictionarySearch').focus();
    }

    closeDictionary() {
        const modal = document.getElementById('dictionaryModal');
        modal.classList.remove('active');
        document.getElementById('dictionarySearch').value = '';
        document.getElementById('wordDefinition').innerHTML = `
            <div class="no-results">
                <p>Enter a word above to see its definition, synonyms, and more!</p>
            </div>
        `;
        document.getElementById('addToStory').disabled = true;
        document.getElementById('copyWord').disabled = true;
    }

    async searchWord(word) {
        if (!word.trim()) return;

        const resultsDiv = document.getElementById('wordDefinition');
        const addBtn = document.getElementById('addToStory');
        const copyBtn = document.getElementById('copyWord');

        // Show loading
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2em;"><div class="loading-spinner"></div><p>Searching...</p></div>';

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);

            if (!response.ok) {
                throw new Error('Word not found');
            }

            const data = await response.json();
            this.displayWordDefinition(data[0], word);

            // Enable action buttons
            addBtn.disabled = false;
            copyBtn.disabled = false;
            addBtn.onclick = () => this.addWordToStory(word);
            copyBtn.onclick = () => this.copyWord(word);

        } catch (error) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <p>Sorry, "${word}" was not found in the dictionary.</p>
                    <p>Try checking the spelling or searching for a different word.</p>
                </div>
            `;
            addBtn.disabled = true;
            copyBtn.disabled = true;
        }
    }

    displayWordDefinition(wordData, searchedWord) {
        const resultsDiv = document.getElementById('wordDefinition');

        let html = `<div class="word-entry">`;

        // Word title with phonetic
        html += `<div class="word-title">`;
        html += `<span>${wordData.word}</span>`;
        if (wordData.phonetic) {
            html += `<span class="word-pronunciation">/${wordData.phonetic}/</span>`;
        }
        html += `</div>`;

        // Meanings
        wordData.meanings.forEach((meaning, index) => {
            html += `<div class="word-meaning">`;
            html += `<div class="word-part-of-speech">${meaning.partOfSpeech}</div>`;

            meaning.definitions.forEach((def, defIndex) => {
                html += `<p><strong>${defIndex + 1}.</strong> ${def.definition}</p>`;
                if (def.example) {
                    html += `<p><em>"${def.example}"</em></p>`;
                }
            });

            // Synonyms
            if (meaning.synonyms && meaning.synonyms.length > 0) {
                html += `<div class="word-synonyms">`;
                html += `<div class="synonyms-title">Synonyms:</div>`;
                html += `<div class="synonyms-list">`;
                meaning.synonyms.slice(0, 8).forEach(synonym => {
                    html += `<span class="synonym-tag" onclick="wordProcessor.searchWord('${synonym}')">${synonym}</span>`;
                });
                html += `</div></div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
        resultsDiv.innerHTML = html;
    }

    addWordToStory(word) {
        const currentPage = this.pages[this.currentPage];
        if (currentPage) {
            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

            if (range && currentPage.content.contains(range.commonAncestorContainer)) {
                // Insert at cursor position
                range.insertNode(document.createTextNode(word + ' '));
            } else {
                // Append to end of page
                currentPage.content.textContent += word + ' ';
            }

            this.updateStats();
            this.closeDictionary();
        }
    }

    copyWord(word) {
        navigator.clipboard.writeText(word).then(() => {
            // Show temporary feedback
            const copyBtn = document.getElementById('copyWord');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="action-icon">✅</span> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 1500);
        });
    }
}

// Initialize word processor when writing portal is shown
let wordProcessor;

document.getElementById("writingNav").onclick = function() {
    showPage('addStory', this);
    // Initialize word processor if not already done
    if (!wordProcessor) {
        setTimeout(() => {
            wordProcessor = new WordProcessor();
        }, 100);
    }
};

document.getElementById("signOutBtn").onclick = function() {
    // Clear persistent login data
    localStorage.removeItem(userStorageKey);

    // Hide main app and show landing page
    document.getElementById("mainApp").style.display = 'none';
    document.getElementById("landingPage").style.display = 'block';
    document.getElementById("myH1").textContent = 'Welcome to Co Operator';

    // Clear forms
    document.getElementById("landingUsername").value = '';
    document.getElementById("landingPassword").value = '';
    document.getElementById("landingAge").value = '';
    document.getElementById("rememberMe").checked = false;
    document.getElementById("landingGreeting").textContent = '';
};

function showPage(pageId, button) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.style.display = 'none');
    
    // Remove active class from nav buttons
    const navButtons = document.querySelectorAll('#mainNav button');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Add active class to clicked button
    if (button) {
        button.classList.add('active');
    }
}

// Story library and AI helpers
const storyLibrary = generateStoryLibrary();

function generateStoryLibrary() {
    const themes = [
        'Crystal', 'Shadow', 'Starlight', 'Midnight', 'Silver', 'Phoenix', 'Dragon', 'Celestial', 'Neon', 'Aurora',
        'Eclipse', 'Thunder', 'Sapphire', 'Obsidian', 'Radiant', 'Storm', 'Nebula', 'Harmony', 'Mythic', 'Infinity'
    ];
    const epics = [
        'Saga', 'Chronicle', 'Odyssey', 'Legend', 'Quest', 'Reckoning', 'Empire', 'Awakening', 'Dream', 'Rebirth'
    ];

    return Array.from({ length: 50 }, (_, index) => {
        const title = `${themes[index % themes.length]} ${epics[index % epics.length]} ${index + 1}`;
        return {
            id: `story-${index + 1}`,
            title,
            wordCount: 500000,
            chapters: 50,
            chapterLength: 10000,
            genre: ['Fantasy', 'Adventure', 'Sci-Fi', 'Mystery', 'Anime', 'Thriller'][index % 6],
            summary: `An epic ${themes[index % themes.length].toLowerCase()} ${epics[index % epics.length].toLowerCase()} set across 50 chapters, designed to immerse you in a ${['legendary', 'mysterious', 'vivid', 'action-packed'][index % 4]} universe.`,
            preview: `Chapter 1 opens with a vivid scene full of energy and motion, hinting at a long saga of dramatic twists and unforgettable characters.`
        };
    });
}

function renderFeaturedStories() {
    const storyList = document.getElementById('storyList');
    if (!storyList) return;

    storyList.innerHTML = '';
    storyLibrary.forEach(story => {
        const storyCard = document.createElement('div');
        storyCard.className = 'story-card';
        storyCard.innerHTML = `
            <h3>${story.title}</h3>
            <p>${story.summary}</p>
            <p><strong>Genre:</strong> ${story.genre} • <strong>Chapters:</strong> ${story.chapters} • <strong>Words:</strong> ${story.wordCount.toLocaleString()}</p>
            <button class="toolbar-btn" onclick="showStoryDetail('${story.id}')">View Details</button>
        `;
        storyList.appendChild(storyCard);
    });
}

function showStoryDetail(storyId) {
    const story = storyLibrary.find(item => item.id === storyId);
    const detailPanel = document.getElementById('storyDetail');
    if (!detailPanel) return;
    if (!story) {
        detailPanel.innerHTML = '<p>Story details are not available.</p>';
        return;
    }

    detailPanel.innerHTML = `
        <div class="story-detail-card">
            <h3>${story.title}</h3>
            <p>${story.summary}</p>
            <ul>
                <li><strong>Genre:</strong> ${story.genre}</li>
                <li><strong>Chapters:</strong> ${story.chapters}</li>
                <li><strong>Estimated words:</strong> ${story.wordCount.toLocaleString()}</li>
                <li><strong>Words per chapter:</strong> ${story.chapterLength.toLocaleString()}</li>
            </ul>
            <p><strong>Preview:</strong> ${story.preview}</p>
        </div>
    `;
}

function openEncyclopediaSearch() {
    const query = document.getElementById('encyclopediaQuery').value.trim();
    if (!query) {
        alert('Please type a subject to search in Wikipedia and Britannica.');
        return;
    }

    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`;
    const britannicaUrl = `https://www.britannica.com/search?query=${encodeURIComponent(query)}`;

    window.open(wikiUrl, '_blank');
    window.open(britannicaUrl, '_blank');
}

function importCurrentDocument() {
    const fileInput = document.getElementById('fileUploadInput');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert('Please choose a text file to import.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        let text = event.target.result || '';
        text = cleanImportedText(text);

        const pageContent = wordProcessor ? wordProcessor.pages[wordProcessor.currentPage].content : document.querySelector('.page-text');
        if (pageContent) {
            pageContent.textContent = text;
            if (wordProcessor) {
                wordProcessor.updateStats();
            }
            alert('Document imported successfully. Symbols and hidden characters have been cleaned.');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function cleanImportedText(text) {
    const noBom = text.replace(/^\uFEFF/, '');
    const cleaned = noBom.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    return cleaned.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
}

function appendChatMessage(sender, message) {
    const output = document.getElementById('chatOutput');
    if (!output) return;
    const entry = document.createElement('div');
    entry.className = `chat-message ${sender}`;
    entry.innerHTML = `<strong>${sender === 'assistant' ? 'Co Operator AI' : 'You'}:</strong> <span>${message}</span>`;
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
}

function getActiveChatModel() {
    const modelSelect = document.getElementById('chatModelSelect');
    return modelSelect ? modelSelect.value : 'chatgpt';
}

function handleChatRequest() {
    const input = document.getElementById('chatInput');
    const prompt = input ? input.value.trim() : '';
    if (!prompt) {
        alert('Please enter a chat prompt or AI request.');
        return;
    }
    const model = getActiveChatModel();
    appendChatMessage('user', prompt);
    const response = generateAIResponse(prompt, model);
    appendChatMessage('assistant', response);
}

function expandCurrentStory() {
    const targetInput = document.getElementById('wordGoalInput');
    const targetWords = targetInput ? parseInt(targetInput.value, 10) : 1000;
    if (isNaN(targetWords) || targetWords <= 0) {
        alert('Enter a valid target word count.');
        return;
    }

    const pageContent = wordProcessor ? wordProcessor.pages[wordProcessor.currentPage].content : document.querySelector('.page-text');
    if (!pageContent) {
        alert('No active writing page found.');
        return;
    }

    const currentText = pageContent.textContent || '';
    const newText = extendTextToTarget(currentText, targetWords, 'expanded');
    pageContent.textContent = newText;
    if (wordProcessor) {
        wordProcessor.updateStats();
    }
    appendChatMessage('assistant', `Expanded your story toward ${Math.min(targetWords, maxAIWordTarget).toLocaleString()} words.`);
}

function animeTransformCurrentStory() {
    const pageContent = wordProcessor ? wordProcessor.pages[wordProcessor.currentPage].content : document.querySelector('.page-text');
    if (!pageContent) {
        alert('No active writing page found.');
        return;
    }

    const currentText = pageContent.textContent || '';
    const transformed = transformTextForAnime(currentText);
    pageContent.textContent = transformed;
    if (wordProcessor) {
        wordProcessor.updateStats();
    }
    appendChatMessage('assistant', 'Your story has been transformed with anime-inspired language and vivid action beats.');
}

function generateAIResponse(prompt, model) {
    const lower = prompt.toLowerCase();
    if (/anime|anime-style|anime style|manga/.test(lower)) {
        return 'Anime energy fills the text: vivid action, emotional beats, cinematic pacing, and bright visual details that make the story feel like an animated sequence.';
    }
    if (/expand|lengthen|longer|more words|word count/.test(lower)) {
        return 'I can help expand this story with richer detail, stronger pacing, and more immersive worldbuilding. Use the Lengthen Story button to grow the current page toward your selected target.';
    }
    if (/chapter|idea|plot|character|scene/.test(lower)) {
        return `The ${model} assistant is ready to help. Ask it for new chapter ideas, clearer character arcs, or a vivid anime-style scene.`;
    }
    return `The ${model} assistant is ready to help. Try asking it to create new chapter ideas, polish dialogue, or build anime scenes for your story.`;
}

function extendTextToTarget(text, targetWords, style) {
    const currentWords = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const goal = Math.min(targetWords, maxAIWordTarget);
    if (currentWords >= goal) {
        return text + '\n\nYour current text already meets or exceeds the requested word count.';
    }

    const fragments = [
        'A ripple of excitement spread through the air as the next scene came alive with detail.',
        'The hero’s heartbeat matched the sound of rushing wind and distant thunder.',
        'Moonlight painted the alley in silver, revealing shadows that held secrets.',
        'A soft glow flickered across the horizon, promising the next adventure.',
        'Every word added a new color to the world, turning simple moments into unforgettable scenes.',
        'A sudden burst of energy carried the story forward, introducing fresh tension and emotion.',
        'The characters moved with purpose, each gesture building toward the next dramatic turn.',
        'Bold descriptions filled the space, making the setting feel as rich as a story told in animated motion.'
    ];

    const addedFragments = [];
    let wordCount = currentWords;
    while (wordCount < goal) {
        const fragment = fragments[Math.floor(Math.random() * fragments.length)];
        addedFragments.push(fragment);
        wordCount += fragment.trim().split(/\s+/).length;
    }

    const extendedText = text.trim() + '\n\n' + addedFragments.join(' ');
    return extendedText;
}

function transformTextForAnime(text) {
    const animePhrases = [
        'A cascade of neon light painted the scene, and every heartbeat felt alive.',
        'A whirlwind of motion and emotion carried the story forward with cinematic intensity.',
        'The protagonist’s resolve sparkled like a comet, and every choice echoed like thunder.',
        'This moment felt like the opening of a dramatic anime sequence, full of energy and longing.'
    ];

    if (!text.trim()) {
        return animePhrases.join(' ');
    }

    const sentences = text.split(/([.!?]+)/).filter(Boolean);
    const transformed = sentences.map((segment, index) => {
        let sentence = segment;
        sentence = sentence.replace(/\band\b/gi, 'and then');
        sentence = sentence.replace(/\bis\b/gi, 'becomes');
        sentence = sentence.replace(/\bwas\b/gi, 'burst forth as');
        sentence = sentence.replace(/\bthe\b/gi, 'the shimmering');
        sentence = sentence.replace(/\bnow\b/gi, 'in this moment');
        sentence = sentence.replace(/\bbeautiful\b/gi, 'breathtaking');
        sentence = sentence.replace(/\bvery\b/gi, 'extraordinarily');
        if (index % 2 === 0 && Math.random() > 0.6) {
            sentence = sentence.trim() + ' The scene seemed drawn from a brilliant anime world.';
        }
        return sentence;
    }).join('');

    const extra = animePhrases[Math.floor(Math.random() * animePhrases.length)];
    return `${transformed.trim()} ${extra}`;
}

// New utility bindings
if (document.getElementById('encyclopediaSearchBtn')) {
    document.getElementById('encyclopediaSearchBtn').onclick = openEncyclopediaSearch;
}
if (document.getElementById('encyclopediaQuery')) {
    document.getElementById('encyclopediaQuery').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            openEncyclopediaSearch();
        }
    });
}
if (document.getElementById('importDocumentBtn')) {
    document.getElementById('importDocumentBtn').onclick = importCurrentDocument;
}
if (document.getElementById('chatSendBtn')) {
    document.getElementById('chatSendBtn').onclick = handleChatRequest;
}
if (document.getElementById('expandStoryBtn')) {
    document.getElementById('expandStoryBtn').onclick = expandCurrentStory;
}
if (document.getElementById('animeStoryBtn')) {
    document.getElementById('animeStoryBtn').onclick = animeTransformCurrentStory;
}
if (document.getElementById('themeSelect')) {
    document.getElementById('themeSelect').addEventListener('change', (e) => applyTheme(e.target.value));
}
if (document.getElementById('accentColorPicker')) {
    document.getElementById('accentColorPicker').addEventListener('input', (e) => setAccentColor(e.target.value));
}
if (document.getElementById('darkModeToggle')) {
    document.getElementById('darkModeToggle').addEventListener('change', (e) => applyTheme(e.target.checked ? 'dark' : 'light'));
}

const moreMenuBtn = document.getElementById('moreMenuBtn');
const moreMenu = document.getElementById('moreMenuDropdown');
if (moreMenuBtn && moreMenu) {
    moreMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        moreMenu.classList.toggle('show');
        moreMenuBtn.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        moreMenu.classList.remove('show');
        moreMenuBtn.classList.remove('active');
    });

    moreMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

function closeMoreMenu() {
    if (moreMenu) {
        moreMenu.classList.remove('show');
    }
    if (moreMenuBtn) {
        moreMenuBtn.classList.remove('active');
    }
}

// OLD FORM HANDLING CODE - COMMENTED OUT SINCE SIDEBAR WAS REMOVED
// The old story form elements (storyForm, storyTitle, storyContent) no longer exist
// Users now use the new Word Processor instead

/*
document.getElementById("storyForm").onsubmit = function(event) {
    event.preventDefault(); // Prevent form from submitting
    const title = document.getElementById("storyTitle").value;
    const content = document.getElementById("storyContent").value;
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    
    if (!title) {
        alert('Please enter a story title.');
    } else if (!content) {
        alert('Please enter story content.');
    } else if (words < 1000) {
        alert(`Your story must be at least 1000 words. Current word count: ${words}`);
    } else {
        addStory(title, content);
        
        // Clear the form
        document.getElementById("storyTitle").value = '';
        document.getElementById("storyContent").value = '';
        
        // Switch to stories page to show the new story
        showPage('stories');
    }
};

document.getElementById("storyForm").onsubmit = function(event) {
    event.preventDefault(); // Prevent form from submitting
    const title = document.getElementById("storyTitle").value;
    const content = document.getElementById("storyContent").value;
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    
    if (!title) {
        alert('Please enter a story title.');
    } else if (!content) {
        alert('Please enter story content.');
    } else if (words < 1000) {
        alert(`Your story must be at least 1000 words. Current word count: ${words}`);
    } else {
        addStory(title, content);
        
        // Clear the form
        document.getElementById("storyTitle").value = '';
        document.getElementById("storyContent").value = '';
    }
};

function addStory(title, content, id = null, fontSize = null, fontColor = null, fontFamily = null, fileName = null, fileContent = null) {
    const storyList = document.getElementById("storyList");
    const storyItem = document.createElement("div");
    storyItem.className = "story-item";
    const storyId = id || Date.now(); // Use provided id or generate new one
    storyItem.setAttribute("data-id", storyId);
    
    // Get current font styles if not provided (use defaults since sidebar was removed)
    const currentFontSize = fontSize || '16px';
    const currentFontColor = fontColor || '#000000';
    const currentFontFamily = fontFamily || 'Arial, sans-serif';
    
    // Check if this story was created from an uploaded file
    const textarea = document.getElementById("storyContent");
    const uploadedFileName = fileName || textarea.getAttribute("data-filename");
    const uploadedFileContent = fileContent || textarea.getAttribute("data-filecontent");
    
    let downloadButton = '';
    if (uploadedFileName && uploadedFileContent) {
        downloadButton = `<button class="download-btn" onclick="downloadFile('${uploadedFileName}', '${btoa(uploadedFileContent)}')">Download Original File</button>`;
    }
    
    storyItem.innerHTML = `
        <h3>${title}</h3>
        <p style="font-size: ${currentFontSize}; color: ${currentFontColor}; font-family: ${currentFontFamily};">${content.replace(/\n/g, '<br>')}</p>
        ${downloadButton}
        <button class="edit-btn" onclick="editStory(${storyId})">Edit</button>
        <button class="delete-btn" onclick="deleteStory(${storyId})">Delete</button>
    `;
    
    storyList.appendChild(storyItem);
    
    // Save to localStorage
    saveStories();
    
    // Clear file attributes after adding
    textarea.removeAttribute("data-filename");
    textarea.removeAttribute("data-filecontent");
    
    // Scroll to the new story
    storyItem.scrollIntoView({ behavior: 'smooth' });
}

function editStory(id) {
    const storyItem = document.querySelector(`[data-id="${id}"]`);
    const title = storyItem.querySelector("h3").textContent;
    const content = storyItem.querySelector("p").textContent.replace(/<br>/g, '\n');
    const fontSize = storyItem.querySelector("p").style.fontSize;
    const fontColor = storyItem.querySelector("p").style.color;
    const fontFamily = storyItem.querySelector("p").style.fontFamily;
    
    // Populate the form
    document.getElementById("storyTitle").value = title;
    document.getElementById("storyContent").value = content;
    
    // Set font controls
    document.getElementById("fontSize").value = fontSize;
    document.getElementById("fontColor").value = fontColor;
    document.getElementById("fontFamily").value = fontFamily;
    applyFontStyles(); // Apply to textarea
    
    // Change submit button to update
    const submitBtn = document.querySelector("#storyForm button[type='submit']");
    submitBtn.textContent = "Update Story";
    submitBtn.onclick = function() { updateStory(id); };
}

function updateStory(id) {
    const newTitle = document.getElementById("storyTitle").value;
    const newContent = document.getElementById("storyContent").value;
    const words = newContent.trim() === '' ? 0 : newContent.trim().split(/\s+/).length;
    
    if (!newTitle) {
        alert('Please enter a story title.');
    } else if (!newContent) {
        alert('Please enter story content.');
    } else if (words < 1000) {
        alert(`Your story must be at least 1000 words. Current word count: ${words}`);
    } else {
        const storyItem = document.querySelector(`[data-id="${id}"]`);
        storyItem.querySelector("h3").textContent = newTitle;
        storyItem.querySelector("p").innerHTML = newContent.replace(/\n/g, '<br>');
        
        // Reset form
        document.getElementById("storyTitle").value = '';
        document.getElementById("storyContent").value = '';
        const submitBtn = document.querySelector("#storyForm button[type='submit']");
        submitBtn.textContent = "Add Story";
        submitBtn.onclick = null; // Reset to default
        
        // Save to localStorage
        saveStories();
    }
}

function deleteStory(id) {
    if (confirm("Are you sure you want to delete this story?")) {
        const storyItem = document.querySelector(`[data-id="${id}"]`);
        storyItem.remove();
        
        // Save to localStorage
        saveStories();
    }
}
*/

function saveStories() {
    const stories = [];
    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach(item => {
        const id = item.getAttribute("data-id");
        const title = item.querySelector("h3").textContent;
        const content = item.querySelector("p").textContent.replace(/<br>/g, '\n');
        const fontSize = item.querySelector("p").style.fontSize;
        const fontColor = item.querySelector("p").style.color;
        const fontFamily = item.querySelector("p").style.fontFamily;
        
        // Check if there's a download button (indicating uploaded file)
        const downloadBtn = item.querySelector(".download-btn");
        let fileName = null;
        let fileContent = null;
        if (downloadBtn) {
            // Extract filename from the onclick attribute
            const onclickAttr = downloadBtn.getAttribute("onclick");
            const matches = onclickAttr.match(/downloadFile\('([^']+)', '([^']+)'\)/);
            if (matches) {
                fileName = matches[1];
                fileContent = atob(matches[2]);
            }
        }
        
        stories.push({ id, title, content, fontSize, fontColor, fontFamily, fileName, fileContent });
    });
    localStorage.setItem("stories", JSON.stringify(stories));
}

function loadStories() {
    const stories = JSON.parse(localStorage.getItem("stories") || "[]");
    stories.forEach(story => {
        addStory(story.title, story.content, story.id, story.fontSize, story.fontColor, story.fontFamily, story.fileName, story.fileContent);
    });
}

function downloadFile(fileName, encodedContent) {
    const content = atob(encodedContent);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// OLD FILE UPLOAD AND FONT CONTROL CODE - COMMENTED OUT SINCE SIDEBAR WAS REMOVED
// The old elements (storyContent, fontSize, fontColor, fontFamily, fileUpload) no longer exist
// Users now use the new Word Processor toolbar controls instead

/*
// Word count functionality
document.getElementById("storyContent").addEventListener("input", function() {
    const text = this.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const wordCountEl = document.getElementById("wordCount");
    
    wordCountEl.textContent = `Words: ${words}`;
    
    // Remove the cutoff logic - allow unlimited words
    wordCountEl.classList.remove("warning");
});

// Font controls
document.getElementById("fontSize").addEventListener("change", applyFontStyles);
document.getElementById("fontColor").addEventListener("change", applyFontStyles);
document.getElementById("fontFamily").addEventListener("change", applyFontStyles);

function applyFontStyles() {
    const fontSize = document.getElementById("fontSize").value;
    const fontColor = document.getElementById("fontColor").value;
    const fontFamily = document.getElementById("fontFamily").value;
    
    const textarea = document.getElementById("storyContent");
    textarea.style.fontSize = fontSize;
    textarea.style.color = fontColor;
    textarea.style.fontFamily = fontFamily;
}

// File upload functionality
document.getElementById("fileUpload").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            document.getElementById("storyContent").value = content;
            // Store file info for later use
            document.getElementById("storyContent").setAttribute("data-filename", file.name);
            document.getElementById("storyContent").setAttribute("data-filecontent", content);
            // Trigger word count update
            document.getElementById("storyContent").dispatchEvent(new Event('input'));
        };
        reader.readAsText(file);
    }
});
*/
