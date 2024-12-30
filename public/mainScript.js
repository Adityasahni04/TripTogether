const API_BASE_URL = "http://localhost:9000";
const groupList = document.getElementById("group-list"); // Ensure this element exists in your HTML

var modal = document.getElementById("myModal");

var btn = document.getElementById("createGroupBtn");

var span = document.getElementsByClassName("close")[0];

const socket = io(API_BASE_URL);

btn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
async function loadGroups() {
  try {
    const response = await fetch(`${API_BASE_URL}/groups`);
    if (!response.ok) throw new Error("Failed to fetch groups.");
    const groups = await response.json();

    groupList.innerHTML = ""; // Clear previous content
    groups.forEach((group) => {
      const groupElement = document.createElement("div");
      groupElement.classList.add("group");
      groupElement.dataset.groupId = group._id;

      // Group content
      groupElement.innerHTML = `
        <div class="group-content">
          <div class="group-header">
            <h3>${group.name}</h3>
          </div>
          <p>${group.description}</p>
          <p><strong>Location:</strong> ${group.location}</p>
        </div>
      `;

      // Check if the user is a member or admin
      if (!group.isMemberOrAdmin) {
        const joinButton = document.createElement("button");
        joinButton.textContent = "Join Group";
        joinButton.classList.add("join-btn");
        joinButton.setAttribute("aria-label", `Join the group ${group.name}`);
        joinButton.addEventListener("click", () => joinGroup(group._id));

        // Append join button to header
        const groupHeader = groupElement.querySelector(".group-header");
        groupHeader.appendChild(joinButton);
      } else {
        const memberLabel = document.createElement("p");
        memberLabel.textContent = "You are a member or admin of this group.";
        groupElement.appendChild(memberLabel);
      }

      groupList.appendChild(groupElement);
    });
  } catch (error) {
    console.error("Error loading groups:", error);
  }
}


// Placeholder functions for group actions
document.getElementById("groupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;

  try {
    // Hide the modal
    modal.style.display = "none";

    // Send POST request with the group data
    const response = await fetch(`${API_BASE_URL}/addGroup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, location }),
    });

    // Check if the request was successful
    if (response.ok) {
      const result = await response.json();
      alert(`Group created successfully! ${result.message || ""}`); // Show success message
      loadGroups();
      socket.emit("joinGroup", name);
      fetchMessages(name); 
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message || "Failed to add group"}`); // Show error message
    }
  } catch (error) {
    console.error("Error adding group:", error);
    alert("An error occurred while adding the group.");
  }
});

// Join Group
async function joinGroup(groupId) {
  try {
    const response = await fetch(`${API_BASE_URL}/joinGroup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const result = await response.json();
    alert(result.message);
    fetchMessages(groupId);
    socket.emit("joinGroup", groupId);
  } catch (error) {
    console.error("Error joining group:", error);
  }
}
//fetch messages
async function fetchMessages(groupId) {
  try {
    console.log("I am in feach messages");
      const response = await fetch(`${API_BASE_URL}/api/get-messages/${groupId}`);
      const data = await response.json();
      console.log(data);

      const messagesContainer = document.querySelector(".chat-messages");
      messagesContainer.innerHTML = ""; // Clear old messages
      data.messages.forEach((msg) => appendMessage(msg));
  } catch (error) {
      console.error("Error fetching messages:", error);
  }
}


socket.on("newMessage", async(message) => {
  console.log("New message received:", message);
  console.log("requesting is append the message");
  const response = await fetch(`${API_BASE_URL}/GetuserId`);
  const data = await response.json();
    const userId = data;
    console.log("Leftid"+userId);
  const messagesContainer = document.querySelector(".chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message";
  if (message.userId === userId) {
    messageElement.classList.add("sent"); // For messages sent by the current user
  } else {
    messageElement.classList.add("received"); // For messages received from others
  }
  messageElement.innerHTML = `${message.userId}: ${message.message}`;
  messagesContainer.appendChild(messageElement);
});

function sendMessage(groupId, userId, message) {
  if (message.trim() !== "") {
      socket.emit("sendMessage", { groupId, userId, message });
  }
}

// Append a message to the chat
async function appendMessage(message) {
  console.log("requesting is append the message");
  const response = await fetch(`${API_BASE_URL}/GetuserId`);
  const data = await response.json();
    const userId = data;
    console.log("Leftid"+userId);
  const messagesContainer = document.querySelector(".chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message";
  if (message.userId === userId) {
    messageElement.classList.add("sent"); // For messages sent by the current user
  } else {
    messageElement.classList.add("received"); // For messages received from others
  }
  messageElement.innerHTML = `${message.userId}: ${message.message}`;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
}

// Leave Group
async function leaveGroup(groupName) {
  try {
    const response = await fetch(`${API_BASE_URL}/leaveGroup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    const result = await response.json();
    alert(result.message || "Left the group successfully!");
    if(result.message==="Successfully left the group")
    {
      location.reload();
    }
  } catch (error) {
    console.error("Error leaving group:", error);
  }
}

// Delete Group
async function deleteGroup(groupName) {
  try {
    const response = await fetch(`${API_BASE_URL}/deleteGroup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    const result = await response.json();
    alert(result.message || "Group deleted successfully!");
    location.reload();
    loadGroups();
  } catch (error) {
    console.error("Error deleting group:", error);
  }
}



groupList.addEventListener("click", async (event) => {
  const clickedGroup = event.target.closest(".group");
  if (clickedGroup) {
    // Remove the active class from previously selected group
    document.querySelectorAll(".group").forEach((group) => {
      group.classList.remove("active");
    });

    // Add the active class to the clicked group
    clickedGroup.classList.add("active");

    const fullText = clickedGroup.textContent.trim();
    const firstLine = fullText.split("\n")[0].trim(); // Trim any extra spaces

    if (!firstLine) {
      console.error("No valid group name found.");
      return; // Exit early if firstLine is empty or invalid
    }

    console.log("Selected group name:", firstLine);

    try {
      const response = await fetch(`/api/check-group-membership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstLine }),
      });

      const data = await response.json();
      const isAdmin = data.isAdmin; // Correctly extract the admin status
      console.log("API Response - isAdmin:", isAdmin);

      if (data.isMember) {
        console.log("User is part of the group");
        toggleChatElements(true); // Show chat elements
      } else {
        console.log("User is not part of the group");
        toggleChatElements(false); // Hide chat elements
      }

      setActiveGroup(firstLine, isAdmin);
      socket.emit("joinGroup",firstLine);
      fetchMessages(firstLine);  
    } catch (error) {
      console.error("Error checking group membership:", error);
    }
  }
});

let currentActiveGroup = null;

function setActiveGroup(groupName, isAdmin) {
  currentActiveGroup = groupName;
  console.log("Setting active group and admin status:", groupName, isAdmin);
  updateHeader(isAdmin);
}

function updateHeader(isAdmin) {
  const header = document.querySelector(".chat-header h3");
  const buttonsContainer = document.querySelector(".chat-header-buttons");

  if (!header || !buttonsContainer) {
    console.error("Header or buttons container not found");
    return;
  }

  if (currentActiveGroup) {
    header.textContent = currentActiveGroup; // Update the header with the active group name

    // Clear any existing buttons
    buttonsContainer.innerHTML = "";
    console.log("Admin status in updateHeader:", isAdmin);

    // Create and append the "Delete" button (visible only to admins)
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "btn-delete"; // Optional: add a class for styling
      deleteButton.addEventListener("click", () =>
        deleteGroup(currentActiveGroup)
      );
      buttonsContainer.appendChild(deleteButton);
    }
    const leaveButton = document.createElement("button");
    leaveButton.textContent = "Leave";
    leaveButton.className = "btn-leave"; // Optional: add a class for styling
    leaveButton.addEventListener("click", () => leaveGroup(currentActiveGroup));

    buttonsContainer.appendChild(leaveButton);
  } else {
    header.textContent = "No Active Group"; // Default text when no group is active

    // Clear any existing buttons
    buttonsContainer.innerHTML = "";
  }
}
async function handleSendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();
  console.log("handleSendMessage:" + currentActiveGroup);

  if (!currentActiveGroup) {
    alert("No group selected. Please select a group to send a message.");
    return;
  }

  if (message && currentActiveGroup) {
    try {
      // Await the fetch response and parse the JSON data
      const response = await fetch(`${API_BASE_URL}/GetuserId`);
      const data = await response.json();
        const userId = data;  

      // Send message using the current active group and user ID
      sendMessage(currentActiveGroup, userId, message);

      // Clear the input field after sending the message
      messageInput.value = "";
    } catch (error) {
      console.error("Error fetching user ID:", error);
    }
  } else {
    console.error("Message or group is missing");
  }
}

// Function to toggle the visibility of chat elements
function toggleChatElements(show) {
  const chatElements = document.querySelectorAll(
    ".main-chat, .chat-header, .chat-messages, .message-input, .message-input input, .message-input button"
  );

  chatElements.forEach((element) => {
    if (show) {
      // Manually reset the display to the default behavior for each element
      if (element.classList.contains("main-chat")) {
        element.style.display = "flex"; // For flex container
      } else if (element.classList.contains("chat-header")) {
        element.style.display = "flex"; // Header as flex
      } else if (element.classList.contains("chat-messages")) {
        element.style.display = "flex"; // Chat messages block
      } else if (element.classList.contains("message-input")) {
        element.style.display = "flex"; // Input as flex
      } else if (element.tagName === "INPUT") {
        element.style.display = "inline-block"; // Input elements
      } else if (element.tagName === "BUTTON") {
        element.style.display = "inline-block"; // Button elements
      } else {
        element.style.display = ""; // Default behavior for other elements
      }
      console.log(`Showing element: ${element.className}`);
    } else {
      element.style.display = "none"; // Hide the element
      console.log(`Hiding element: ${element.className}`);
    }
  });
}
loadGroups();
