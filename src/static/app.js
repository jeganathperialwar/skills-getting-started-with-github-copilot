document.addEventListener("DOMContentLoaded", () => {
  console.debug("app.js loaded, DOM ready");
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      console.debug("fetching /activities (absolute)");
      let response = await fetch("/activities");
      // fallback to relative path if absolute fails (useful when opening file://)
      if (!response.ok) {
        console.debug("absolute /activities returned", response.status, "trying relative 'activities'");
        response = await fetch("activities");
      }

      console.debug("activities response status:", response.status);
      const activities = await response.json();
      console.debug("activities payload:", activities);

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select options (keep placeholder)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Normalize participants into an array (support array, object, comma string)
        let participants = [];
        if (Array.isArray(details.participants)) {
          participants = details.participants;
        } else if (details.participants && typeof details.participants === "object") {
          participants = Object.values(details.participants);
        } else if (typeof details.participants === "string") {
          participants = details.participants
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const spotsLeft = details.max_participants - (participants ? participants.length : 0);

        // Build card DOM (use elements to ensure participants are visible)
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description || "";

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule || "TBD"}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsLabel = document.createElement("p");
        participantsLabel.innerHTML = "<strong>Participants:</strong>";
        participantsSection.appendChild(participantsLabel);

        if (participants && participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            const text = typeof p === "string" ? p : (p.name || p.email || JSON.stringify(p));
            li.textContent = text;
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const np = document.createElement("p");
          np.className = "no-participants";
          np.textContent = "No participants yet";
          participantsSection.appendChild(np);
        }

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      console.debug("signup response:", response.status, result);

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the participants list updates
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
