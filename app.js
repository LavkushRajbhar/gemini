const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const toggleThemeButton = document.querySelector('#toggle-theme-button');
const deleteChatButton = document.querySelector('#delete-chat-button');
const suggestions = document.querySelectorAll('.suggestion-list .suggestion');

let userMessage = null;
let isResponseGenerating = false;

// API Configuration
const API_KEY = "AIzaSyDYr46S3j-wMcBRMRz-FAcPwq4v6yke23s";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;




// Load local storage for saved chats and theme
const loadLocalStorage = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
};
loadLocalStorage();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];

        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // Save Chats to local storage
            chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
        }

    }, 75);
};

// Fetch response from the API based on the user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector('.text'); // Get Text Element
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error.message);

        // Get the API response text and remove asterisks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

        if (!apiResponse.trim()) { // Check if the response is empty
            showTypingEffect("The API did not return a meaningful response. Please try again.", textElement, incomingMessageDiv);
        } else {
            showTypingEffect(apiResponse, textElement, incomingMessageDiv);
        }
    } catch (error) {
        isResponseGenerating = false;
        console.error("Error fetching API response:", error.message);
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
          <img src="images/gemini.svg" class="avtar" alt="Gemini Image" />
          <p class="text"></p>
          <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
};

// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // Show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Revert icon after 1 second
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;

    if (!userMessage || userMessage.length < 3) { // Check if the message is empty or too short
        console.warn("Please enter a valid message. It should be at least 3 characters long.");
        return; // Exit the function
    }
    if (!userMessage) return;

    if (isResponseGenerating) return; // Exit if a response is already being generated

    isResponseGenerating = true;

    // Create HTML for outgoing message with an Edit button
    const html = `<div class="message-content">
          <img src="images/user.jpg" class="avtar" alt="user Image" />
          <p class="text"></p>
           <span class="edit-btn material-symbols-outlined" style="cursor:pointer;">edit</span>
        </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").textContent = userMessage;
    chatList.appendChild(outgoingMessageDiv);
    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    document.body.classList.add("hide-header"); // Hide the header once chat is started

    // Show the loading animation after a delay
    setTimeout(showLoadingAnimation, 500);

    // Add event listener to the Edit button
    const editButton = outgoingMessageDiv.querySelector(".edit-btn");
    editButton.addEventListener("click", () => {
        const messageText = outgoingMessageDiv.querySelector(".text").textContent;
        typingForm.querySelector(".typing-input").value = messageText; // Fill the input with the current message text
        typingForm.querySelector(".typing-input").focus(); // Focus the input field for editing
        isResponseGenerating = false; // Allow the user to send the edited message
    });
};

// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});



// Toggle Light Mode and Dark Mode
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalStorage();
    }
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});


