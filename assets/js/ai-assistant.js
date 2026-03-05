(function() {
    'use strict';

    const aiBtn = document.getElementById('aiAssistantBtn');
    const aiPopup = document.getElementById('aiPopup');
    const aiCloseBtn = document.getElementById('aiCloseBtn');
    const aiTextInput = document.getElementById('aiTextInput');
    const aiSendBtn = document.getElementById('aiSendBtn');
    const aiChatBox = document.getElementById('aiChatBox');
    const aiStatus = document.getElementById('aiStatus');

    aiBtn.addEventListener('click', () => {
        aiPopup.classList.toggle('active');
        if (aiPopup.classList.contains('active')) {
            aiTextInput.focus();
        }
    });

    aiCloseBtn.addEventListener('click', () => {
        aiPopup.classList.remove('active');
    });

    aiSendBtn.addEventListener('click', () => {
        const message = aiTextInput.value.trim();
        if (message) {
            handleUserInput(message);
        }
    });

    aiTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = aiTextInput.value.trim();
            if (message) {
                handleUserInput(message);
            }
        }
    });

    function handleUserInput(message) {
        addMessage(message, 'user');
        aiTextInput.value = '';
        
        setTimeout(() => {
            const response = generateResponse(message);
            addMessage(response, 'bot');
            aiStatus.textContent = '';
        }, 500);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-${sender}-message`;
        
        const messageP = document.createElement('p');
        messageP.textContent = text;
        
        messageDiv.appendChild(messageP);
        aiChatBox.appendChild(messageDiv);
        
        aiChatBox.scrollTop = aiChatBox.scrollHeight;
    }

    function generateResponse(input) {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('cricket')) {
            return "Cricket is a bat-and-ball game played between two teams. Visit our Cricket page to learn about rules, positions, and legends!";
        }
        
        if (lowerInput.includes('football') || lowerInput.includes('soccer')) {
            return "Football is the world's most popular sport! Check out our Football section for tactics, formations, and legendary players.";
        }
        
        if (lowerInput.includes('basketball') || lowerInput.includes('basket')) {
            return "Basketball is a fast-paced indoor sport. Visit our Basketball page to learn about positions, rules, and NBA legends!";
        }
        
        if (lowerInput.includes('golf')) {
            return "Golf is a precision club-and-ball sport. Explore our Golf section to learn about techniques, courses, and famous golfers.";
        }

        if (lowerInput.includes('language') || lowerInput.includes('hindi') || lowerInput.includes('tamil')) {
            return "You can switch to Hindi (हिन्दी) or Tamil (தமிழ்) using the language selector at the top. We support multilingual content!";
        }

        if (lowerInput.includes('assessment') || lowerInput.includes('quiz') || lowerInput.includes('test')) {
            return "We offer interactive assessments to test your sports knowledge! Select a sport and navigate to the Assessment section.";
        }

        if (lowerInput.includes('login') || lowerInput.includes('register') || lowerInput.includes('account')) {
            return "You can login or register from the login page. Select your language first to get started!";
        }

        if (lowerInput.includes('about') || lowerInput.includes('who are you')) {
            return "SportsInfo is your premier destination for learning about Cricket, Football, Basketball, and Golf. We provide comprehensive guides in multiple languages!";
        }

        if (lowerInput.includes('feedback') || lowerInput.includes('contact')) {
            return "You can share your feedback using the feedback button (💬) at the bottom right of the page. We'd love to hear from you!";
        }

        if (lowerInput.match(/^(hi|hello|hey|hola|namaste)/)) {
            return "Hello! How can I help you today? Ask me about cricket, football, basketball, golf, or navigating the website!";
        }

        if (lowerInput.includes('thank')) {
            return "You're welcome! Feel free to ask if you need anything else.";
        }

        if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
            return "Goodbye! Enjoy exploring SportsInfo. Come back anytime!";
        }

        if (lowerInput.includes('help') || lowerInput === '?') {
            return "I can help you with:\n• Information about Cricket, Football, Basketball, Golf\n• Language selection and navigation\n• Assessments and quizzes\n• Account registration\n\nJust ask away!";
        }

        return "I'm here to help with sports information! Try asking about cricket, football, basketball, golf, or how to navigate the website.";
    }

})();
