# MMM-MySchoolMenus

Pulls school menus from [MySchoolMenus](https://www.myschoolmenus.com/) and
displays them on your MagicMirror².

## Installation

### Install

In your terminal, go to your [MagicMirror²][mm] Module folder and clone
MMM-MySchoolMenus:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/brandonmartinez/MMM-MySchoolMenus.git
```

### Update

```bash
cd ~/MagicMirror/modules/MMM-MySchoolMenus
git pull
```

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```js
    {
        module: 'MMM-MySchoolMenus',
        position: 'bottom_right',
        config: {
            organizationId: 'YOUR_ORGANIZATION_ID',
            menuId: 'THE_MENU_ID'
        }
    },
```

## Configuration options

| Option           | Possible values | Default       | Description                     |
| ---------------- | --------------- | ------------- | ------------------------------- |
| `organizationId` | `string`        | not available | TBD                             |
| `menuId`         | `string`        | not available | TBD                             |

[mm]: https://github.com/MagicMirrorOrg/MagicMirror
