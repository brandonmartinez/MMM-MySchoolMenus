Module.register("MMM-MySchoolMenus", {

  defaults: {

  },
  getStyles() {
    return ["template.css"]
  },
  start() {
    this.templateContent = this.config.exampleContent

    setInterval(() => this.renderContent(), 1000 * 60 * 5);
  },
  getDom() {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = `<b>Title</b><br />${this.templateContent}`

    return wrapper
  },
  fetchMenuData(year, month) {
    const ORGANIZATION_ID = this.config.organizationId;
    const MENU_ID = this.config.menuId;;

    const url = `https://www.myschoolmenus.com/api/organizations/${ORGANIZATION_ID}/menus/${MENU_ID}/year/${year}/month/${month}/date_overwrites`;
    try {
      const response = axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data for ${year}-${month}:`, error.message);
      return [];
    }
  },
  processMenuData() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const currentMonthData = this.fetchMenuData(currentYear, currentMonth) || [];
    const nextMonthData = this.fetchMenuData(nextYear, nextMonth) || [];
    const allData = [...currentMonthData, ...nextMonthData];

    const parsedData = [];
    data.forEach(item => {
      const entry = {
        date: new Date(item.day),
        items: []
      };

      const menuItems = JSON.parse(item.setting).current_display;
      menuItems
        .filter(menuItem => menuItem.type === 'recipe')
        .forEach(menuItem => {
          entry.items.push(menuItem.name);
        });

      parsedData.push(entry);
    });

    return parsedData;
  },
  renderContent() {
    const menuData = this.processMenuData();
    const menuHtml = menuData.map(item => {
      return `<div>
        <strong>${item.date.toLocaleDateString()}</strong>
        <ul>${item.items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`;
    }).join('');

    this.templateContent = menuHtml;
    this.updateDom();
  }
})
