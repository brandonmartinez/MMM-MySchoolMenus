Module.register("MMM-MySchoolMenus", {
  defaults: {
    numberOfWeeks: 2,
    updateFrequency: 60 * 5,
    menuItemWeightMinimum: 3,
    menuItemWeightMaximum: 5,
    menus: []
  },
  logInfo() {
    const args = ["MMM-MySchoolMenus", ...arguments]
    Log.info(...args);
  },
  getStyles() {
    return ["template.css"]
  },
  start() {
    setTimeout(() => this.getLunchMenu(), 100);
    setInterval(() => this.getLunchMenu(), 1000 * this.config.updateFrequency);
  },
  getLunchMenu() {
    this.logInfo("Requesting lunch menu data for identifier: " + this.identifier);
    this.sendSocketNotification("GET_LUNCH_MENU", { config: this.config, identifier: this.identifier });
  },
  getDom() {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = this.templateContent || "Loading...";

    return wrapper;
  },
  getHeader() {
    return this.data.header;
  },
  socketNotificationReceived: function (notification, payload) {
    if (notification === "NEW_LUNCH_MENU" && payload.identifier === this.identifier) {
      this.logInfo("Received NEW_LUNCH_MENU notification, updating data…", payload);
      this.renderContent(payload.data);
    }
  },
  renderContent(data) {
    if (!data || data.length === 0) {
      this.templateContent = "No menu data available.";
      this.updateDom();
      return;
    }

    const maxDays = this.config.numberOfWeeks * 5;
    const today = new Date();
    const agenda = {};

    // Combine all menu items by date
    data.forEach(entry => {
      entry.data.forEach(menu => {
      const menuDate = new Date(menu.date);
      if (menuDate >= today) {
        const dateKey = menuDate.toISOString().split("T")[0];
        if (!agenda[dateKey]) {
        agenda[dateKey] = [];
        }
        agenda[dateKey].push(`<span class="menu"><span class="menu-name">${entry.name}:</span> <span class="menu-items">${menu.items.join(", ")}</span></span>`);
      }
      });
    });

    // Sort dates and limit to maxDays
    const sortedDates = Object.keys(agenda)
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(0, maxDays);

    // Build the content
    this.templateContent = sortedDates.map(dateKey => {
      const date = new Date(dateKey);
      const shortMonth = date.toLocaleString("default", { month: "short" });
      const day = date.getDate();
      const items = agenda[dateKey].join("");
      return `<div class="menu-day"><span class="menu-date">${shortMonth} ${day}</span>${items}</div>`;
    }).join("");

    this.updateDom();
  }
})
