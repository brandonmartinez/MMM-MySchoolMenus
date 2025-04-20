const NodeHelper = require("node_helper")
const axios = require("axios");
const Log = require("logger");

function logInfo() {
    const args = ["MMM-MySchoolMenus", ...arguments]
    Log.info(...args);
}

async function getLunchMenuData(organizationId, menuId, year, month) {
    const url = `https://www.myschoolmenus.com/api/organizations/${organizationId}/menus/${menuId}/year/${year}/month/${month}/date_overwrites`;
    logInfo(`Fetching data from URL: ${url}`);
    try {
        const response = await axios.get(url);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching data for ${year}-${month}:`, error.message);
        return [];
    }
}

async function getLunchMenu(organizationId, menuId, menuItemWeightMinimum, menuItemWeightMaximum) {
    logInfo(`Getting menu information for:`, ...arguments);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const currentMonthData = await getLunchMenuData(organizationId, menuId, currentYear, currentMonth) || [];
    const nextMonthData = await getLunchMenuData(organizationId, menuId, nextYear, nextMonth) || [];
    const allData = [...currentMonthData, ...nextMonthData];

    logInfo(`Fetched ${allData.length} menu items for ${currentYear}-${currentMonth} and ${nextYear}-${nextMonth}`);

    const parsedData = [];
    allData.forEach(item => {
        logInfo(`Processing data for menu item on ${item.day}`);
        const entry = {
            date: new Date(item.day),
            items: []
        };

        const menuItems = JSON.parse(item.setting).current_display;
        // logInfo(`Menu items for  ${item.day}`, menuItems);
        menuItems
            .filter(menuItem => menuItem.type === 'recipe' && !!menuItem.weight && menuItem.weight >= menuItemWeightMinimum && menuItem.weight <= menuItemWeightMaximum)
            .forEach(menuItem => {
                entry.items.push(menuItem.name);
            });

        parsedData.push(entry);
    });

    logInfo(`Parsed ${parsedData.length} menu entries`, parsedData);
    return parsedData;
}

module.exports = NodeHelper.create({
    async socketNotificationReceived(notification, payload) {
        if (notification === "GET_LUNCH_MENU") {
            logInfo("Received GET_LUNCH_MENU notification, getting data…", payload);
            const AsyncJob = async () => {
                const processedMenuItems = [];

                for (const menu of payload.config.menus) {
                    logInfo("Getting data for " + menu.name, menu);
                    const lunchMenu = await getLunchMenu(
                        menu.organizationId,
                        menu.menuId,
                        menu.menuItemWeightMinimum || payload.config.menuItemWeightMinimum,
                        menu.menuItemWeightMaximum || payload.config.menuItemWeightMaximum
                    );
                    const m = {
                        organizationId: menu.organizationId,
                        menuId: menu.menuId,
                        name: menu.name,
                        data: lunchMenu
                    }
                    processedMenuItems.push(m);
                    // logInfo("Fetched " + menu.name + " menu data", m);
                }

                const newPayload = { identifier: payload.identifier, data: processedMenuItems };
                logInfo(`Sending NEW_LUNCH_MENU notification`, newPayload);
                this.sendSocketNotification("NEW_LUNCH_MENU", newPayload);
            }
            AsyncJob()
        }
    },
})