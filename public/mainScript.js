const API_BASE_URL = "http://localhost:9000";
const groupList = document.getElementById("group-list"); // Ensure this element exists in your HTML

// Example placeholder for isAdmin check
const isAdmin = true; // You may replace this with actual admin check logic

var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("createGroupBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
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

      groupElement.innerHTML = `
                <h3>${group.name}</h3>
                <p>${group.description}</p>
                <p><strong>Location:</strong> ${group.location}</p>
            `;

      const joinButton = document.createElement("button");
      joinButton.textContent = "Join Group";
      joinButton.addEventListener("click", () => joinGroup(group._id));

      const leaveButton = document.createElement("button");
      leaveButton.textContent = "Leave Group";
      leaveButton.addEventListener("click", () => leaveGroup(group._id));

      groupElement.appendChild(joinButton);
      groupElement.appendChild(leaveButton);

      if (isAdmin) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Group";
        deleteButton.addEventListener("click", () => deleteGroup(group._id));
        groupElement.appendChild(deleteButton);
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
      loadGroups(); // Function to refresh or load the list of groups (assumed to be defined elsewhere)
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
  } catch (error) {
    console.error("Error joining group:", error);
  }
}

// Leave Group
async function leaveGroup(groupId) {
  try {
    const response = await fetch(`${API_BASE_URL}/leaveGroup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const result = await response.json();
    alert(result.message || "Left the group successfully!");
  } catch (error) {
    console.error("Error leaving group:", error);
  }
}

// Delete Group
async function deleteGroup(groupId) {
  try {
    const response = await fetch(`${API_BASE_URL}/deleteGroup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const result = await response.json();
    alert(result.message || "Group deleted successfully!");
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
        console.log("API Response:", data);
  
        if (data.isMember) {
          console.log("User is part of the group");
          toggleChatElements(true); // Show chat elements
        } else {
          console.log("User is not part of the group");
          toggleChatElements(false); // Hide chat elements
        }
      } catch (error) {
        console.error("Error checking group membership:", error);
      }
  
      setActiveGroup(firstLine);
    }
  });
  
  let currentActiveGroup = null;
  
  function setActiveGroup(groupName) {
    currentActiveGroup = groupName;
    updateHeader();
  }
  
  function updateHeader() {
    const header = document.querySelector(".chat-header");
    if (currentActiveGroup) {
      header.textContent = currentActiveGroup; // Update the header with the active group name
    } else {
      header.textContent = "No Active Group"; // Default text when no group is active
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
        if (element.classList.contains('main-chat')) {
          element.style.display = 'flex'; // For flex container
        } else if (element.classList.contains('chat-header')) {
          element.style.display = 'flex'; // Header as flex
        } else if (element.classList.contains('chat-messages')) {
          element.style.display = 'block'; // Chat messages block
        } else if (element.classList.contains('message-input')) {
          element.style.display = 'flex'; // Input as flex
        } else if (element.tagName === 'INPUT') {
          element.style.display = 'inline-block'; // Input elements
        } else if (element.tagName === 'BUTTON') {
          element.style.display = 'inline-block'; // Button elements
        } else {
          element.style.display = ''; // Default behavior for other elements
        }
        console.log(`Showing element: ${element.className}`);
      } else {
        element.style.display = "none"; // Hide the element
        console.log(`Hiding element: ${element.className}`);
      }
    });
  }
    
  loadGroups();
  