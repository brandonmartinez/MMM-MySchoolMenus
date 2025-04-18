const NodeHelper = require("node_helper")
const axios = require("axios");
const Log = require("logger");

async function getLunchMenuData(organizationId, menuId, year, month) {
    const url = `https://www.myschoolmenus.com/api/organizations/${organizationId}/menus/${menuId}/year/${year}/month/${month}/date_overwrites`;
    Log.info(`Fetching data from URL: ${url}`);
    try {
        const response = await axios.get(url);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching data for ${year}-${month}:`, error.message);
        return [];
    }
}

async function getLunchMenu(organizationId, menuId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const currentMonthData = await getLunchMenuData(organizationId, menuId, currentYear, currentMonth) || [];
    const nextMonthData = await getLunchMenuData(organizationId, menuId, nextYear, nextMonth) || [];
    const allData = [...currentMonthData, ...nextMonthData];

    Log.info(`Fetched ${allData.length} menu items for ${currentYear}-${currentMonth} and ${nextYear}-${nextMonth}`);

    const parsedData = [];
    allData.forEach(item => {
        const entry = {
            date: new Date(item.day),
            items: []
        };

        const menuItems = JSON.parse(item.setting).current_display;
        menuItems
            .filter(menuItem => menuItem.type === 'recipe' && !!menuItem.weight && menuItem.weight > 2 && menuItem.weight < 5)
            .forEach(menuItem => {
                entry.items.push(menuItem.name);
            });

        parsedData.push(entry);
    });

    Log.info(`Parsed ${parsedData.length} menu entries`);
    return parsedData;
}

module.exports = NodeHelper.create({
    async socketNotificationReceived(notification, payload) {
        if (notification === "GET_LUNCH_MENU") {
            Log.info("Received GET_LUNCH_MENU notification, getting data…");
            const AsyncJob = async () => {
                const data = await getLunchMenu(
                    payload.organizationId,
                    payload.menuId
                );
                this.sendSocketNotification("NEW_LUNCH_MENU", { identifier: payload.identifier, data: data })
            }
            AsyncJob()
        }
    },
})