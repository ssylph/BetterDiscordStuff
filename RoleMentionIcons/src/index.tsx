import { Webpack, DOM } from "betterdiscord";
import BasePlugin from "zlibrary/plugin";
import SettingsPanel from "./components/SettingsPanel";
import { Settings, filter, getProps, peopleSVG } from "./utils";

const {
	Filters: { byProps },
	getModule,
} = Webpack;

const GuildStore = getModule(byProps("getGuildCount"));
const roleMention = getModule(byProps("roleMention")).roleMention.split(" ")[0];

const getIconElement = (roleId: string, roleIcon: string) => {
	const icon = document.createElement("img");
	icon.className = "role-mention-icon";
	icon.setAttribute("style", "border-radius: 3px; object-fit: contain;");
	icon.width = icon.height = 16;
	icon.src = `https://cdn.discordapp.com/role-icons/${roleId}/${roleIcon}.webp?size=24&quality=lossless`;
	return icon;
};

export default class RoleMentionIcons extends BasePlugin {
	clearCallbacks: Set<() => void>;

	constructor() {
		super();
		this.clearCallbacks = new Set();
	}

	onStart() {
		DOM.addStyle(".role-mention-icon { position: relative; top: 2px; margin-left: 4px; }");

		const elements = Array.from(document.getElementsByClassName(roleMention));
		this.processElements(elements);
	}

	observer({ addedNodes }) {
		for (const node of addedNodes) {
			if (node.nodeType === Node.TEXT_NODE) continue;
			const elements = Array.from(node.getElementsByClassName(roleMention));
			this.processElements(elements);
		}
	}

	processElements(elements) {
		if (!elements.length) return;

		for (const element of elements) {
			const props = getProps(element, (e) => e.roleName || e.roleId);
			if (!props) return;

			const isEveryone = props.roleName === "@everyone";
			const isHere = props.roleName === "@here";
			let role;
			if (props.guildId) {
				role = filter(GuildStore.getGuild(props.guildId)?.roles, (r) => r.id === props.roleId);
				role = role[Object.keys(role)[0]];
			}
			if ((Settings.everyone || !isEveryone) && (Settings.here || !isHere)) {
				if (role?.icon && Settings.showRoleIcons) {
					const icon = getIconElement(role.id, role.icon);
					element.appendChild(icon);
					this.clearCallbacks.add(() => icon.remove());
				} else {
					const icon = peopleSVG.cloneNode(true) as HTMLElement;
					element.appendChild(icon);
					this.clearCallbacks.add(() => icon.remove());
				}
			}
		}
	}

	clearIcons() {
		this.clearCallbacks.forEach((callback) => callback());
		this.clearCallbacks.clear();
	}

	onStop() {
		DOM.removeStyle();
		this.clearIcons();
	}

	getSettingsPanel() {
		return <SettingsPanel />;
	}
}
