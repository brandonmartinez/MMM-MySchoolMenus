Module.register("MMM-MySchoolMenus", {
  defaults: {
    numberOfWeeks: 4,
    updateFrequency: 60 * 5,
    menuItemWeightMinimum: 3,
    menuItemWeightMaximum: 5,
    menus: []
  },
  getStyles() {
    return ["template.css"]
  },
  start() {
    setTimeout(() => this.getLunchMenu(), 100);
    setInterval(() => this.getLunchMenu(), 1000 * this.config.updateFrequency);
  },
  getLunchMenu() {
    Log.info("Requesting lunch menu data for identifier: " + this.identifier);
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
      Log.info("Received NEW_LUNCH_MENU notification, updating data…", payload);
      this.renderContent(payload.data);
    }
  },
  renderContent(data) {
    if (!data || data.length === 0) {
      this.templateContent = "No menu data available.";
      this.updateDom();
      return;
    }

    const maxDays = this.config.numberOfWeeks * 7;
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
        agenda[dateKey].push(`${entry.name}: ${menu.items.join(", ")}`);
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
      const items = agenda[dateKey].map(item => `<span class="menu-item">${item}</span>`).join("<br>");
      return `<div class="menu-day"><span class="menu-date">${shortMonth} ${day}</span><br>${items}</div>`;
    }).join("");

    this.updateDom();
  }
})
