/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  onSettingsMount: () => {
    sessionStorage.setItem("settings-mounted", "true");
  },
  onPluginLoad: ({ ctx }) => {
    const { $general } = ctx.useGeneralContext();
    const root = $general.root;
    const settingsMounted = sessionStorage.getItem("settings-mounted");
    // stop if settings has ever been mounted
    if (settingsMounted) return;

    // unblur NSFW automatically if it's not work time
    if (!isWorkTime() && root) {
      root.dataset.blurNsfw = "false";
    }
  },
};

function isWorkTime(workdays = [1, 2, 3, 4, 5], startHour = 9, endHour = 17) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const hour = now.getHours();
  const mins = now.getMinutes();

  const isWeekday = workdays.includes(day);

  // Compare hour + minutes together
  const nowMinutes = hour * 60 + mins;
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  const isWorkHours = nowMinutes >= startMinutes && nowMinutes < endMinutes;

  return isWeekday && isWorkHours;
}
