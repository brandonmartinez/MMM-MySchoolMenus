Module.register("MMM-MySchoolMenus", {
  defaults: {
    numberOfWeeks: 4,
    updateFrequency: 60 * 5,
    menuItemWeightMinimum: 3,
    menuItemWeightMaximum: 5
  },
  getStyles() {
    return ["template.css"]
  },
  start() {
    setTimeout(() => this.getLunchMenu(), 100);
    setInterval(() => this.getLunchMenu(), 1000 * this.config.updateFrequency);
  },
  getLunchMenu() {
    Log.info("Requesting lunch menu data for organizationId: " + this.config.organizationId + ", menuId: " + this.config.menuId + ", identifier: " + this.identifier);
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
      Log.info("Received NEW_LUNCH_MENU notification, updating data…", payload.data);
      this.renderContent(payload.data);
    }
  },
  renderContent(data) {
    if (!data || data.length === 0) {
      this.templateContent = "No menu data available.";
      this.updateDom();
      return;
    }

    const maxNumberOfWeeks = this.config.numberOfWeeks;
    const currentDate = new Date();
    const currentWeekStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
    const maxDate = new Date(currentWeekStart);
    maxDate.setDate(maxDate.getDate() + (maxNumberOfWeeks * 7));

    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= currentWeekStart && itemDate < maxDate;
    });

    const daysOfWeek = ["M", "T", "W", "T", "F"];
    let currentMonth = "";

    const menuHtml = `
      <table class="menu-calendar">
      <thead>
        <tr>
        ${daysOfWeek.map(day => `<th class="day-header">${day}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${(() => {
        const weeks = [];
        let week = [];
        let lastWeekStart = new Date(currentWeekStart);

        for (let d = new Date(currentWeekStart); d < maxDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          if (!isWeekend) {
            const shortMonth = d.toLocaleString('default', { month: 'short' });
            const dateString = d.getDate();

            if (dayOfWeek === 1) {
              if (week.length > 0) {
                weeks.push(week);
              }
              week = [];
              lastWeekStart = new Date(d);
            }

            const menuItems = filteredData.find(item => {
              const itemDate = new Date(item.date);
              return itemDate.toDateString() === d.toDateString();
            });

            const cellContent = menuItems
              ? menuItems.items.join(', ')
              : "";

            const cellHtml = `
            <td class="menu-cell">
              <span class="date">${dayOfWeek === 1 && currentMonth !== shortMonth ? `<strong>${shortMonth}</strong> ` : ""}${dateString}</span>
              <span class="menu-item">${cellContent}</span>
            </td>
          `;

            week.push(cellHtml);
            currentMonth = shortMonth;
          }
        }

        if (week.length > 0) {
          weeks.push(week);
        }

        return weeks
          .map(week => `<tr>${week.join('')}</tr>`)
          .join('');
      })()}
      </tbody>
      </table>
    `;

    this.templateContent = menuHtml;
    this.updateDom();
  }
})
