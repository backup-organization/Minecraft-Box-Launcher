import settingsTemplate from "../templates/modals/settings.pug";
import { GlobalSettings } from "../store/GlobalSettingsStore";
import { ApplicationStore } from "../store";

export function showSettingsModal(): void {
	$("#modal-settings").replaceWith(settingsTemplate(ApplicationStore.GlobalSettings.store));
	$("#modal-settings").modal({
		closable: false,
		onApprove: () => {
			const $form = $("#form-settings");
			// store data from form into store
			const settings: GlobalSettings = {
				java: {
					externalJavaPath: $form.form("get value", "java-path"),
					// @ts-ignore
					maxMemory: $("#slider-java-memory").slider("get thumbValue", "first") as number,
					// @ts-ignore
					minMemory: $("#slider-java-memory").slider("get thumbValue", "second") as number
				}
			};
			ApplicationStore.GlobalSettings.set(settings); // save settings
		},
		onDeny: () => {
			// throw away form data
		}
	}).modal("show");
	// @ts-ignore
	$(".ui.range.slider").slider({
		min: 256,
		max: 4096,
		start: ApplicationStore.GlobalSettings.get("java").minMemory,
		end: ApplicationStore.GlobalSettings.get("java").maxMemory,
		step: 256
	});
}
