// The rest of the JavaScript is identical to the previous version
document.addEventListener("DOMContentLoaded", () => {
  const app = {
    progress: {},
    totalProjects: 0,
    completedProjects: 0,
    currentView: "focus", // 'focus' or 'browse'
    curriculum: [],

    init() {
      this.curriculum = getCurriculumData();
      this.loadProgress();
      this.render();
      this.addEventListeners();
    },

    addEventListeners() {
      document.getElementById("resetProgress").addEventListener("click", () => this.resetProgress());
      document.getElementById("viewFocus").addEventListener("click", () => this.setView("focus"));
      document.getElementById("viewBrowse").addEventListener("click", () => this.setView("browse"));
      document.getElementById("searchInput").addEventListener("input", (e) => this.handleSearch(e.target.value));
    },

    loadProgress() {
      const savedProgress = localStorage.getItem("vertexFoundryProgress");
      this.progress = savedProgress ? JSON.parse(savedProgress) : {};
    },

    saveProgress() {
      localStorage.setItem("vertexFoundryProgress", JSON.stringify(this.progress));
    },

    resetProgress() {
      if (confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
        this.progress = {};
        this.saveProgress();
        this.render();
      }
    },

    setView(view) {
      this.currentView = view;
      const browseContainer = document.getElementById("browse-view-container");
      browseContainer.innerHTML = ""; // Clear browse view to force re-render
      this.render();
    },

    updateProgressBar() {
      this.totalProjects = 0;
      this.completedProjects = 0;
      this.curriculum.flat().forEach((group) => {
        group.modules.forEach((module) => {
          module.projects.forEach((project) => {
            this.totalProjects++;
            if (this.progress[project.id]) {
              this.completedProjects++;
            }
          });
        });
      });

      const percentage = this.totalProjects > 0 ? Math.round((this.completedProjects / this.totalProjects) * 100) : 0;
      const progressBar = document.getElementById("progressBar");
      progressBar.style.width = `${percentage}%`;
      progressBar.textContent = `${percentage}% (${this.completedProjects}/${this.totalProjects})`;
    },

    render() {
      this.updateProgressBar();
      this.updateViewControls();

      if (this.currentView === "focus") {
        this.renderFocusView();
      } else {
        this.renderBrowseView();
      }
    },

    updateViewControls() {
      const focusBtn = document.getElementById("viewFocus");
      const browseBtn = document.getElementById("viewBrowse");
      const searchContainer = document.getElementById("searchBoxContainer");
      const focusContainer = document.getElementById("focus-view-container");
      const browseContainer = document.getElementById("browse-view-container");

      if (this.currentView === "focus") {
        focusBtn.classList.add("active");
        browseBtn.classList.remove("active");
        searchContainer.style.display = "none";
        focusContainer.style.display = "block";
        browseContainer.style.display = "none";
      } else {
        focusBtn.classList.remove("active");
        browseBtn.classList.add("active");
        searchContainer.style.display = "flex";
        focusContainer.style.display = "none";
        browseContainer.style.display = "block";
      }
    },

    findNextProject() {
      for (const group of this.curriculum) {
        for (const module of group.modules) {
          for (const project of module.projects) {
            if (!this.progress[project.id]) {
              return project;
            }
          }
        }
      }
      return null; // All projects completed
    },

    renderFocusView() {
      const container = document.getElementById("focus-view-container");
      container.innerHTML = "";
      const nextProject = this.findNextProject();

      if (nextProject) {
        const card = this.createProjectCard(nextProject, false, false);
        container.appendChild(card);
      } else {
        const completionMessage = document.createElement("h2");
        completionMessage.textContent = "Congratulations! You have completed all projects!";
        container.appendChild(completionMessage);
      }
    },

    renderBrowseView() {
      const container = document.getElementById("browse-view-container");
      if (container.children.length > 0 && !document.getElementById("searchInput").value) return; // Only render once unless searching
      container.innerHTML = "";

      let firstUncompletedFound = false;
      this.curriculum.forEach((group) => {
        const groupDetails = document.createElement("details");
        groupDetails.className = "module-group";
        const groupSummary = document.createElement("summary");
        groupSummary.textContent = group.category;
        groupDetails.appendChild(groupSummary);

        const moduleContainer = document.createElement("div");
        moduleContainer.className = "module";

        group.modules.forEach((module) => {
          module.projects.forEach((project) => {
            const isCompleted = !!this.progress[project.id];
            let isLocked = true;

            if (!firstUncompletedFound) {
              isLocked = false;
              if (!isCompleted) {
                firstUncompletedFound = true;
                groupDetails.open = true;
              }
            }
            const card = this.createProjectCard(project, isCompleted, isLocked);
            moduleContainer.appendChild(card);
          });
        });

        groupDetails.appendChild(moduleContainer);
        container.appendChild(groupDetails);
      });
      this.handleSearch(document.getElementById("searchInput").value); // Re-apply search after render
    },

    createProjectCard(project, isCompleted, isLocked) {
      const card = document.createElement("div");
      card.id = `project-${project.id}`;
      card.className = "project-card";
      if (isLocked) card.classList.add("locked");

      card.innerHTML = `
                    <h3>${project.title} <span>(${project.level})</span></h3>
                    <pre><code>${project.instructions}</code></pre>
                `;

      if (project.optionalCss) {
        card.innerHTML += `
                        <details class="optional-css">
                            <summary>Optional CSS Challenge</summary>
                            <pre><code>${project.optionalCss}</code></pre>
                        </details>
                    `;
      }

      if (project.resources && project.resources.length > 0) {
        const resourcesHTML = project.resources.map((res) => `<li><a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.name}</a></li>`).join("");
        card.innerHTML += `
                        <div class="resources">
                            <h4>Resources</h4>
                            <ul>${resourcesHTML}</ul>
                        </div>
                    `;
      }

      const button = document.createElement("button");
      button.dataset.projectId = project.id;
      button.className = "project-button";

      if (isCompleted) {
        button.textContent = "✓ Completed";
        button.classList.add("completed");
      } else if (isLocked) {
        button.textContent = "🔒 Locked";
        button.classList.add("locked");
      } else {
        button.textContent = "Mark as Complete";
        button.classList.add("complete");
        button.addEventListener("click", (e) => this.handleCompleteClick(e));
      }

      card.appendChild(button);
      return card;
    },

    handleCompleteClick(event) {
      const button = event.target;
      const projectId = button.dataset.projectId;
      this.progress[projectId] = true;
      this.saveProgress();

      button.textContent = "✓ Completed";
      button.classList.remove("complete");
      button.classList.add("completed");
      button.disabled = true;

      if (this.currentView === "focus") {
        const card = button.closest(".project-card");
        card.classList.add("fade-out");
        setTimeout(() => {
          this.render();
        }, 1500);
      } else {
        const browseContainer = document.getElementById("browse-view-container");
        browseContainer.innerHTML = ""; // Clear to force re-render with new unlocked state
        this.render();
      }
    },

    handleSearch(query) {
      const searchTerm = query.toLowerCase().trim();
      const cards = document.querySelectorAll("#browse-view-container .project-card");
      let matchCount = 0;

      cards.forEach((card) => {
        const cardContent = card.textContent.toLowerCase();
        const isMatch = cardContent.includes(searchTerm);
        card.classList.toggle("hidden", !isMatch);
        if (isMatch) matchCount++;
      });

      document.querySelectorAll("#browse-view-container .module-group").forEach((group) => {
        const hasVisibleCard = group.querySelector(".project-card:not(.hidden)");
        group.classList.toggle("hidden", !hasVisibleCard);
        if (searchTerm) {
          group.open = !!hasVisibleCard;
        }
      });

      const countEl = document.getElementById("searchResultsCount");
      countEl.textContent = searchTerm ? `${matchCount} found` : "";
    },
  };

  app.init();
});